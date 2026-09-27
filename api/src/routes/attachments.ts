import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { authRequired, loadBusinessContext } from '../middleware/auth.js';
import { success, error, notFound, asyncHandler } from '../lib/response.js';
import { uploadToGCS, deleteFromGCS, getPublicUrl } from '../lib/gcs.js';
import { z } from 'zod';

const router = Router();

router.use(authRequired, loadBusinessContext);

const createAttachmentSchema = z.object({
  entityType: z.string().min(1),
  entityId: z.string().optional(),
  fileName: z.string().min(1),
  mimeType: z.string().min(1),
  fileSize: z.number().int().positive(),
  fileData: z.string().min(1), // base64 encoded file data
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

// POST /api/v1/attachments — upload file to GCS and create metadata record
router.post('/', asyncHandler(async (req, res) => {
  const input = createAttachmentSchema.parse(req.body);
  const businessId = req.user!.businessId!;

  // Convert base64 to buffer
  const base64Data = input.fileData.replace(/^data:.*?;base64,/, '');
  const buffer = Buffer.from(base64Data, 'base64');

  // Generate unique filename
  const timestamp = Date.now();
  const randomStr = Math.random().toString(36).substring(2, 10);
  const fileName = `${businessId}/${timestamp}-${randomStr}-${input.fileName}`;

  // Upload to GCS
  const storageKey = await uploadToGCS(fileName, input.mimeType, buffer);

  const attachment = await prisma.attachment.create({
    data: {
      businessId,
      entityType: input.entityType,
      entityId: input.entityId || null,
      fileName: input.fileName,
      mimeType: input.mimeType,
      fileSize: input.fileSize,
      storageKey,
      createdById: req.user!.userId,
    },
  });
  return success(res, attachment, 'Attachment uploaded', 201);
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

  // Delete from GCS
  await deleteFromGCS(attachment.storageKey);

  await prisma.attachment.delete({ where: { id: req.params.id } });
  return success(res, null, 'Attachment deleted');
}));

// GET /api/v1/attachments/:id/url — get public URL
router.get('/:id/url', asyncHandler(async (req, res) => {
  const attachment = await prisma.attachment.findFirst({
    where: { id: req.params.id, businessId: req.user!.businessId! },
  });
  if (!attachment) return notFound(res, 'Attachment');

  return success(res, { url: getPublicUrl(attachment.storageKey) });
}));

export default router;
