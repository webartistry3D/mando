import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { authRequired, loadBusinessContext } from '../middleware/auth.js';
import { success, notFound, asyncHandler } from '../lib/response.js';

const router = Router();

router.use(authRequired, loadBusinessContext);

// GET /api/v1/notifications
router.get('/', asyncHandler(async (req, res) => {
  const notifications = await prisma.notification.findMany({
    where: { businessId: req.user!.businessId! },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
  const unread = await prisma.notification.count({
    where: { businessId: req.user!.businessId!, isRead: false },
  });
  return success(res, { notifications, unread });
}));

// POST /api/v1/notifications/read-all
router.post('/read-all', asyncHandler(async (req, res) => {
  await prisma.notification.updateMany({
    where: { businessId: req.user!.businessId!, isRead: false },
    data: { isRead: true },
  });
  return success(res, null, 'All notifications marked read');
}));

// PATCH /api/v1/notifications/:id/read
router.patch('/:id/read', asyncHandler(async (req, res) => {
  const notification = await prisma.notification.findFirst({
    where: { id: req.params.id, businessId: req.user!.businessId! },
  });
  if (!notification) return notFound(res, 'Notification');

  const updated = await prisma.notification.update({
    where: { id: req.params.id },
    data: { isRead: true },
  });
  return success(res, updated);
}));

export default router;
