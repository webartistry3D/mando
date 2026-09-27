import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { hashPassword } from '../lib/auth.js';
import { authRequired, loadBusinessContext, requireRole } from '../middleware/auth.js';
import { success, error, notFound, asyncHandler } from '../lib/response.js';
import {
  updateBusinessSchema,
  updateBusinessSettingsSchema,
  addMemberSchema,
  updateMemberSchema,
} from '../validators/business.js';

const router = Router();

// All business routes require auth + business context
router.use(authRequired, loadBusinessContext);

// GET /api/v1/business
router.get('/', asyncHandler(async (req, res) => {
  const business = await prisma.business.findUnique({
    where: { id: req.user!.businessId! },
    include: { settings: true },
  });
  if (!business) return notFound(res, 'Business');
  return success(res, business);
}));

// PATCH /api/v1/business
router.patch('/', requireRole('OWNER', 'MANAGER'), asyncHandler(async (req, res) => {
  const input = updateBusinessSchema.parse(req.body);

  // Manager can only update operational settings, not core profile
  if (req.user!.role === 'MANAGER') {
    // Managers cannot change name, logo, cacNumber
    delete (input as any).name;
    delete (input as any).logoAttachmentId;
    delete (input as any).cacNumber;
  }

  const business = await prisma.business.update({
    where: { id: req.user!.businessId! },
    data: input,
  });
  return success(res, business, 'Business updated');
}));

// DELETE /api/v1/business
router.delete('/', requireRole('OWNER'), asyncHandler(async (req, res) => {
  await prisma.business.delete({ where: { id: req.user!.businessId! } });
  return success(res, null, 'Business deleted');
}));

// GET /api/v1/business/settings
router.get('/settings', asyncHandler(async (req, res) => {
  const settings = await prisma.businessSettings.findUnique({
    where: { businessId: req.user!.businessId! },
  });
  if (!settings) return notFound(res, 'Settings');
  return success(res, settings);
}));

// PATCH /api/v1/business/settings
router.patch('/settings', requireRole('OWNER', 'MANAGER'), asyncHandler(async (req, res) => {
  const input = updateBusinessSettingsSchema.parse(req.body);
  const settings = await prisma.businessSettings.update({
    where: { businessId: req.user!.businessId! },
    data: input,
  });
  return success(res, settings, 'Settings updated');
}));

// GET /api/v1/business/members
router.get('/members', asyncHandler(async (req, res) => {
  const members = await prisma.businessMember.findMany({
    where: { businessId: req.user!.businessId! },
    include: {
      user: { select: { id: true, name: true, email: true, phone: true } },
    },
  });
  return success(res, members);
}));

// POST /api/v1/business/members
router.post('/members', requireRole('OWNER'), asyncHandler(async (req, res) => {
  const input = addMemberSchema.parse(req.body);

  const existingUser = await prisma.user.findUnique({ where: { email: input.email } });
  if (existingUser) {
    return error(res, 'CONFLICT', 'Email already registered', 409);
  }

  const user = await prisma.user.create({
    data: {
      name: input.name,
      email: input.email,
      passwordHash: hashPassword(input.password),
    },
  });

  const member = await prisma.businessMember.create({
    data: {
      businessId: req.user!.businessId!,
      userId: user.id,
      role: input.role,
    },
    include: { user: { select: { id: true, name: true, email: true, phone: true } } },
  });
  return success(res, member, 'Member created', 201);
}));

// GET /api/v1/business/members/:id
router.get('/members/:id', asyncHandler(async (req, res) => {
  const member = await prisma.businessMember.findFirst({
    where: { id: req.params.id, businessId: req.user!.businessId! },
    include: { user: { select: { id: true, name: true, email: true, phone: true } } },
  });
  if (!member) return notFound(res, 'Member');
  return success(res, member);
}));

// PATCH /api/v1/business/members/:id
router.patch('/members/:id', requireRole('OWNER'), asyncHandler(async (req, res) => {
  const input = updateMemberSchema.parse(req.body);

  const member = await prisma.businessMember.findFirst({
    where: { id: req.params.id, businessId: req.user!.businessId! },
  });
  if (!member) return notFound(res, 'Member');
  if (member.role === 'OWNER') {
    return error(res, 'CANNOT_CHANGE_OWNER', 'Cannot change the owner role', 403);
  }

  const updated = await prisma.businessMember.update({
    where: { id: req.params.id },
    data: { role: input.role },
    include: { user: { select: { id: true, name: true, email: true, phone: true } } },
  });
  return success(res, updated, 'Member role updated');
}));

// DELETE /api/v1/business/members/:id
router.delete('/members/:id', requireRole('OWNER'), asyncHandler(async (req, res) => {
  const member = await prisma.businessMember.findFirst({
    where: { id: req.params.id, businessId: req.user!.businessId! },
  });
  if (!member) return notFound(res, 'Member');
  if (member.role === 'OWNER') {
    return error(res, 'CANNOT_REMOVE_OWNER', 'Cannot remove the business owner', 403);
  }

  await prisma.businessMember.delete({ where: { id: req.params.id } });
  return success(res, null, 'Member removed');
}));

// PATCH /api/v1/business/members/:id/credentials - Update dispatch user credentials
router.patch('/members/:id/credentials', requireRole('OWNER', 'MANAGER'), asyncHandler(async (req, res) => {
  const { password } = req.body;
  if (!password || typeof password !== 'string' || password.length < 6) {
    return error(res, 'INVALID_PASSWORD', 'Password must be at least 6 characters', 400);
  }

  const member = await prisma.businessMember.findFirst({
    where: { id: req.params.id, businessId: req.user!.businessId! },
    include: { user: true },
  });
  if (!member) return notFound(res, 'Member');
  if (member.role !== 'DISPATCH') {
    return error(res, 'INVALID_ROLE', 'Credentials can only be updated for dispatch users', 400);
  }

  await prisma.user.update({
    where: { id: member.userId },
    data: { passwordHash: hashPassword(password) },
  });

  return success(res, null, 'Credentials updated');
}));

export default router;
