import { Router, type Request, type Response } from 'express';
import rateLimit from 'express-rate-limit';
import { prisma } from '../lib/prisma.js';
import { hashPassword, comparePassword, signToken } from '../lib/auth.js';
import { authRequired } from '../middleware/auth.js';
import { success, error, asyncHandler } from '../lib/response.js';
import { registerSchema, loginSchema } from '../validators/auth.js';

const router = Router();

const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GOOGLE_USERINFO_URL = 'https://www.googleapis.com/oauth2/v2/userinfo';

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, error: { code: 'RATE_LIMITED', message: 'Too many attempts, try again later' } },
});

// POST /api/v1/auth/register
router.post('/register', authLimiter, asyncHandler(async (req, res) => {
  const input = registerSchema.parse(req.body);

  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) {
    return error(res, 'CONFLICT', 'Email already registered', 409);
  }

  const user = await prisma.user.create({
    data: {
      name: input.name,
      email: input.email,
      phone: input.phone,
      passwordHash: hashPassword(input.password),
    },
  });

  const business = await prisma.business.create({
    data: {
      name: input.businessName,
      members: {
        create: { userId: user.id, role: 'OWNER' },
      },
      settings: {
        create: {},
      },
    },
  });

  // Seed default expense categories for the new business
  const defaultCategories = ['Inventory', 'Transport', 'Fuel', 'Rent', 'Utilities', 'Salaries', 'Marketing', 'Equipment', 'Repairs', 'Logistics', 'Other'];
  await prisma.expenseCategory.createMany({
    data: defaultCategories.map((name) => ({ businessId: business.id, name })),
  });

  const token = signToken({ userId: user.id, email: user.email });

  return success(res, {
    token,
    user: { id: user.id, name: user.name, email: user.email, phone: user.phone },
    business: { id: business.id, name: business.name },
  }, 'Registration successful', 201);
}));

// POST /api/v1/auth/login
router.post('/login', authLimiter, asyncHandler(async (req, res) => {
  const input = loginSchema.parse(req.body);

  const user = await prisma.user.findUnique({ where: { email: input.email } });
  if (!user || !comparePassword(input.password, user.passwordHash)) {
    return error(res, 'INVALID_CREDENTIALS', 'Invalid email or password', 401);
  }

  const token = signToken({ userId: user.id, email: user.email });

  return success(res, {
    token,
    user: { id: user.id, name: user.name, email: user.email, phone: user.phone },
  }, 'Login successful');
}));

// POST /api/v1/auth/logout
router.post('/logout', authRequired, (_req, res) => {
  // JWT is stateless — client discards the token
  return success(res, null, 'Logout successful');
});

// GET /api/v1/auth/me
router.get('/me', authRequired, asyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.userId },
    select: { id: true, name: true, email: true, phone: true, createdAt: true },
  });

  if (!user) {
    return error(res, 'NOT_FOUND', 'User not found', 404);
  }

  const memberships = await prisma.businessMember.findMany({
    where: { userId: user.id },
    include: { business: { select: { id: true, name: true } } },
  });

  return success(res, { user, memberships }, 'Current user retrieved');
}));

// GET /api/v1/auth/google — redirect to Google consent screen
router.get('/google', (req: Request, res: Response) => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI || `${process.env.CLIENT_URL?.replace('5173', '3000')}/api/v1/auth/google/callback`;
  if (!clientId) {
    return error(res, 'CONFIG_ERROR', 'Google OAuth is not configured', 500);
  }

  const state = req.query.state || 'login';
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid email profile',
    state: state as string,
    prompt: 'select_account',
  });

  res.redirect(`${GOOGLE_AUTH_URL}?${params.toString()}`);
});

// GET /api/v1/auth/google/callback — handle Google redirect
router.get('/google/callback', asyncHandler(async (req: Request, res: Response) => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI || `${process.env.CLIENT_URL?.replace('5173', '3000')}/api/v1/auth/google/callback`;
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
  const mode = (req.query.state as string) || 'login';

  if (!clientId || !clientSecret) {
    return res.redirect(`${clientUrl}/login?error=google_not_configured`);
  }

  const code = req.query.code;
  if (!code) {
    return res.redirect(`${clientUrl}/login?error=google_auth_failed`);
  }

  // Exchange code for tokens
  const tokenRes = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code: code as string,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }),
  });

  if (!tokenRes.ok) {
    return res.redirect(`${clientUrl}/login?error=google_token_failed`);
  }

  const tokenData = await tokenRes.json() as { access_token: string };

  // Fetch user info from Google
  const userRes = await fetch(GOOGLE_USERINFO_URL, {
    headers: { Authorization: `Bearer ${tokenData.access_token}` },
  });

  if (!userRes.ok) {
    return res.redirect(`${clientUrl}/login?error=google_userinfo_failed`);
  }

  const googleUser = await userRes.json() as { id: string; email: string; name: string; picture?: string };

  // Find user by googleId or email
  let user = await prisma.user.findUnique({ where: { googleId: googleUser.id } });

  if (!user) {
    user = await prisma.user.findUnique({ where: { email: googleUser.email } });
    if (user) {
      // Link Google to existing account
      user = await prisma.user.update({
        where: { id: user.id },
        data: { googleId: googleUser.id },
      });
    }
  }

  if (!user) {
    // New user — for signup mode, create account + business
    // For login mode, redirect to register with prefill hint
    if (mode === 'signup') {
      user = await prisma.user.create({
        data: {
          name: googleUser.name,
          email: googleUser.email,
          googleId: googleUser.id,
          passwordHash: '',
        },
      });

      const business = await prisma.business.create({
        data: {
          name: `${googleUser.name}'s Business`,
          members: { create: { userId: user.id, role: 'OWNER' } },
          settings: { create: {} },
        },
      });

      // Seed default expense categories
      const defaultCategories = ['Inventory', 'Transport', 'Fuel', 'Rent', 'Utilities', 'Salaries', 'Marketing', 'Equipment', 'Repairs', 'Logistics', 'Other'];
      await prisma.expenseCategory.createMany({
        data: defaultCategories.map((name) => ({ businessId: business.id, name })),
      });
    } else {
      // Login mode but no account exists — redirect to register
      return res.redirect(`${clientUrl}/register?error=google_no_account&email=${encodeURIComponent(googleUser.email)}`);
    }
  }

  const token = signToken({ userId: user.id, email: user.email });

  // Redirect to frontend with token
  return res.redirect(`${clientUrl}/auth/google/success?token=${token}`);
}));

export default router;
