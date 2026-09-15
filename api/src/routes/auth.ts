import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { prisma } from '../lib/prisma.js';
import { hashPassword, comparePassword, signToken } from '../lib/auth.js';
import { authRequired } from '../middleware/auth.js';
import { success, error, asyncHandler } from '../lib/response.js';
import { registerSchema, loginSchema } from '../validators/auth.js';

const router = Router();

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

export default router;
