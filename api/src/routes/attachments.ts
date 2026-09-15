import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { authRequired, loadBusinessContext } from '../middleware/auth.js';
import { success, error, notFound, asyncHandler } from '../lib/response.js';
import { z } from 'zod';

const router = Router();

router.use(authRequired, loadBusinessContext);

const createAttachmentSchema = z.object({
  entityType: z.string().min(1),
  entityId: z.string().optional(),
  fileName: z.string().min(1),
  mimeType: z.string().min(1),
  fileSize: z.number().int().positive(),
  storageKey: z.string().min(1),
});

// GET /api/v1/attachments?entityType=X&entityId=Y
router.get('/', asyncHandler(async (req, res) => {
  const { entityType, entityId } = req.query;
  const where: Record<string, unknown> = { businessId: req.user!.businessId! };

  if (entityType && typeof entityType === 'string') where.entityType = entityType;
  if (entityId && typeof entityId === 'string') where.entityId = entityId;

  const attachments = await prisma.attachment.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  });
  return success(res, attachments);
}));

// POST /api/v1/attachments — create metadata record (file content sent to GCS separately)
router.post('/', asyncHandler(async (req, res) => {
  const input = createAttachmentSchema.parse(req.body);
  const businessId = req.user!.businessId!;

  const attachment = await prisma.attachment.create({
    data: {
      businessId,
      entityType: input.entityType,
      entityId: input.entityId || null,
      fileName: input.fileName,
      mimeType: input.mimeType,
      fileSize: input.fileSize,
      storageKey: input.storageKey,
      createdById: req.user!.userId,
    },
  });
  return success(res, attachment, 'Attachment recorded', 201);
}));

// GET /api/v1/attachments/:id
router.get('/:id', asyncHandler(async (req, res) => {
  const attachment = await prisma.attachment.findFirst({
    where: { id: req.params.id, businessId: req.user!.businessId! },
  });
  if (!attachment) return notFound(res, 'Attachment');
  return success(res, attachment);
}));

// DELETE /api/v1/attachments/:id
router.delete('/:id', asyncHandler(async (req, res) => {
  const attachment = await prisma.attachment.findFirst({
    where: { id: req.params.id, businessId: req.user!.businessId! },
  });
  if (!attachment) return notFound(res, 'Attachment');

  await prisma.attachment.delete({ where: { id: req.params.id } });
  return success(res, null, 'Attachment deleted');
}));

// GET /api/v1/attachments/:id/url — get signed URL (placeholder for GCS)
router.get('/:id/url', asyncHandler(async (req, res) => {
  const attachment = await prisma.attachment.findFirst({
    where: { id: req.params.id, businessId: req.user!.businessId! },
  });
  if (!attachment) return notFound(res, 'Attachment');

  // In production, generate a GCS signed URL here.
  // For now, return the storageKey as the URL reference.
  return success(res, { url: attachment.storageKey });
}));

export default router;
