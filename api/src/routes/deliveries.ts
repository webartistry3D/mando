import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { authRequired, loadBusinessContext, requireRole } from '../middleware/auth.js';
import { success, error, notFound, asyncHandler } from '../lib/response.js';
import { createDeliverySchema, updateDeliverySchema } from '../validators/delivery.js';
import { recalcInvoiceTotals } from './invoices.js';
import type { DeliveryStatus } from '@prisma/client';

const router = Router();

router.use(authRequired, loadBusinessContext);

async function nextDeliveryNumber(businessId: string): Promise<string> {
  const settings = await prisma.businessSettings.findUnique({ where: { businessId } });
  const prefix = settings?.deliveryPrefix || 'DEL';
  const last = await prisma.delivery.findFirst({
    where: { businessId },
    orderBy: { createdAt: 'desc' },
    select: { number: true },
  });
  const seq = last ? parseInt(last.number.replace(/\D/g, ''), 10) + 1 : 1;
  return `${prefix}-${String(seq).padStart(3, '0')}`;
}

const validTransitions: Record<DeliveryStatus, DeliveryStatus[]> = {
  PENDING: ['PROCESSING', 'CANCELLED'],
  PROCESSING: ['OUT_FOR_DELIVERY', 'CANCELLED'],
  OUT_FOR_DELIVERY: ['DELIVERED', 'FAILED'],
  DELIVERED: [],
  FAILED: ['PENDING', 'CANCELLED'],
  CANCELLED: [],
};

// GET /api/v1/deliveries
router.get('/', asyncHandler(async (req, res) => {
  const { status, customerId } = req.query;
  const where: Record<string, unknown> = { businessId: req.user!.businessId! };

  // Dispatch users can only see deliveries assigned to them
  if (req.user!.role === 'DISPATCH') {
    const member = await prisma.businessMember.findFirst({
      where: { userId: req.user!.userId, businessId: req.user!.businessId! },
    });
    if (member) {
      where.dispatchedToId = member.id;
    }
  }

  if (status && typeof status === 'string') where.status = status;
  if (customerId && typeof customerId === 'string') where.customerId = customerId;

  const deliveries = await prisma.delivery.findMany({
    where,
    include: {
      customer: { select: { id: true, name: true, phone: true } },
      invoice: { select: { id: true, number: true, total: true } },
      dispatchedTo: { include: { user: { select: { id: true, name: true, email: true } } } },
      items: { include: { product: { select: { id: true, name: true, sku: true } } } },
    },
    orderBy: { createdAt: 'desc' },
  });
  return success(res, deliveries);
}));

// POST /api/v1/deliveries
router.post('/', asyncHandler(async (req, res) => {
  const input = createDeliverySchema.parse(req.body);
  const businessId = req.user!.businessId!;

  // Delivery creation is intentionally disabled for standalone delivery fees.
  // All invoice delivery charges are sourced from accepted estimate conversions.
  if (!input.invoiceId) {
    return error(res, 'FORBIDDEN', 'New delivery records are disabled. Use an estimate conversion to add delivery fees to an invoice.', 400);
  }

  const invoice = await prisma.invoice.findFirst({
    where: { id: input.invoiceId, businessId },
  });
  if (!invoice) return notFound(res, 'Invoice');

  // Verify customer if provided
  if (input.customerId) {
    const customer = await prisma.customer.findFirst({
      where: { id: input.customerId, businessId },
    });
    if (!customer) return notFound(res, 'Customer');
  }

  // Verify dispatchedTo if provided (only OWNER/MANAGER can assign)
  let dispatchedToId = null;
  if (input.dispatchedToId) {
    if (req.user!.role === 'DISPATCH') {
      return error(res, 'FORBIDDEN', 'Dispatch users cannot assign deliveries', 403);
    }
    const assignee = await prisma.businessMember.findFirst({
      where: { id: input.dispatchedToId, businessId, role: 'DISPATCH' },
    });
    if (!assignee) {
      return error(res, 'INVALID_ASSIGNEE', 'Invalid dispatch user', 400);
    }
    dispatchedToId = input.dispatchedToId;
  }

  const number = await nextDeliveryNumber(businessId);

  const delivery = await prisma.delivery.create({
    data: {
      businessId,
      invoiceId: input.invoiceId || null,
      customerId: input.customerId || null,
      number,
      deliveryAddress: input.deliveryAddress,
      recipientName: input.recipientName,
      recipientPhone: input.recipientPhone,
      deliveryFee: 0,
      assignedPerson: input.assignedPerson,
      trackingReference: input.trackingReference,
      status: 'PENDING',
      notes: input.notes,
      createdById: req.user!.userId,
      dispatchedToId,
      ...(input.items && input.items.length > 0 ? {
        items: {
          create: input.items.map((item) => ({
            productId: item.productId || undefined,
            description: item.description,
            quantity: item.quantity,
          })),
        },
      } : {}),
    },
    include: {
      customer: { select: { id: true, name: true, phone: true } },
      invoice: { select: { id: true, number: true } },
      dispatchedTo: { include: { user: { select: { id: true, name: true, email: true } } } },
      items: true,
    },
  });

  if (delivery.invoiceId) await recalcInvoiceTotals(delivery.invoiceId);
  return success(res, delivery, 'Delivery created', 201);
}));

// GET /api/v1/deliveries/:id
router.get('/:id', asyncHandler(async (req, res) => {
  const where: Record<string, unknown> = { id: req.params.id, businessId: req.user!.businessId! };

  // Dispatch users can only view deliveries assigned to them
  if (req.user!.role === 'DISPATCH') {
    const member = await prisma.businessMember.findFirst({
      where: { userId: req.user!.userId, businessId: req.user!.businessId! },
    });
    if (member) {
      where.dispatchedToId = member.id;
    }
  }

  const delivery = await prisma.delivery.findFirst({
    where,
    include: {
      customer: true,
      invoice: { select: { id: true, number: true, total: true } },
      dispatchedTo: { include: { user: { select: { id: true, name: true, email: true } } } },
      items: { include: { product: { select: { id: true, name: true, sku: true } } } },
    },
  });
  if (!delivery) return notFound(res, 'Delivery');
  return success(res, delivery);
}));

// PATCH /api/v1/deliveries/:id
router.patch('/:id', asyncHandler(async (req, res) => {
  const input = updateDeliverySchema.parse(req.body);
  const businessId = req.user!.businessId!;

  const delivery = await prisma.delivery.findFirst({
    where: { id: req.params.id, businessId },
    include: { items: true },
  });
  if (!delivery) return notFound(res, 'Delivery');

  // Dispatch users can only update status of their assigned deliveries
  if (req.user!.role === 'DISPATCH') {
    const member = await prisma.businessMember.findFirst({
      where: { userId: req.user!.userId, businessId: req.user!.businessId! },
    });
    if (!member || delivery.dispatchedToId !== member.id) {
      return error(res, 'FORBIDDEN', 'You can only update deliveries assigned to you', 403);
    }
    // Dispatch users can only update status, recipientConfirmation, proofPhotoAttachmentId, and signatureAttachmentId
    const allowedFields = ['status', 'recipientConfirmation', 'proofPhotoAttachmentId', 'signatureAttachmentId'];
    for (const key of Object.keys(input)) {
      if (!allowedFields.includes(key)) {
        return error(res, 'FORBIDDEN', `Dispatch users cannot update ${key}`, 403);
      }
    }
  }

  // Verify dispatchedToId if provided (only OWNER/MANAGER can assign)
  let dispatchedToId = undefined;
  if (input.dispatchedToId !== undefined) {
    if (req.user!.role === 'DISPATCH') {
      return error(res, 'FORBIDDEN', 'Dispatch users cannot assign deliveries', 403);
    }
    if (input.dispatchedToId === null) {
      dispatchedToId = null;
    } else {
      const assignee = await prisma.businessMember.findFirst({
        where: { id: input.dispatchedToId, businessId, role: 'DISPATCH' },
      });
      if (!assignee) {
        return error(res, 'INVALID_ASSIGNEE', 'Invalid dispatch user', 400);
      }
      dispatchedToId = input.dispatchedToId;
    }
  }

  if (input.status && !validTransitions[delivery.status].includes(input.status)) {
    return error(res, 'INVALID_TRANSITION', `Cannot transition from ${delivery.status} to ${input.status}`, 400);
  }

  const updated = await prisma.delivery.update({
    where: { id: delivery.id },
    data: {
      ...(input.deliveryAddress !== undefined ? { deliveryAddress: input.deliveryAddress } : {}),
      ...(input.recipientName !== undefined ? { recipientName: input.recipientName } : {}),
      ...(input.recipientPhone !== undefined ? { recipientPhone: input.recipientPhone } : {}),
      ...(input.deliveryFee !== undefined ? { deliveryFee: 0 } : {}),
      ...(input.assignedPerson !== undefined ? { assignedPerson: input.assignedPerson } : {}),
      ...(input.trackingReference !== undefined ? { trackingReference: input.trackingReference } : {}),
      ...(input.notes !== undefined ? { notes: input.notes } : {}),
      ...(input.status ? { status: input.status } : {}),
      ...(input.recipientConfirmation !== undefined ? { recipientConfirmation: input.recipientConfirmation } : {}),
      ...(input.proofPhotoAttachmentId !== undefined ? { proofPhotoAttachmentId: input.proofPhotoAttachmentId } : {}),
      ...(input.signatureAttachmentId !== undefined ? { signatureAttachmentId: input.signatureAttachmentId } : {}),
      ...(input.status === 'DELIVERED' ? { deliveredAt: new Date() } : {}),
      ...(dispatchedToId !== undefined ? { dispatchedToId } : {}),
    },
    include: {
      customer: { select: { id: true, name: true, phone: true } },
      invoice: { select: { id: true, number: true } },
      dispatchedTo: { include: { user: { select: { id: true, name: true, email: true } } } },
      items: true,
    },
  });
  if (updated.invoiceId) await recalcInvoiceTotals(updated.invoiceId);
  return success(res, updated, 'Delivery updated');
}));

// DELETE /api/v1/deliveries/:id — only pending
router.delete('/:id', asyncHandler(async (req, res) => {
  const delivery = await prisma.delivery.findFirst({
    where: { id: req.params.id, businessId: req.user!.businessId! },
  });
  if (!delivery) return notFound(res, 'Delivery');
  if (delivery.status !== 'PENDING') {
    return error(res, 'FORBIDDEN', 'Only pending deliveries can be deleted', 400);
  }

  const invoiceId = delivery.invoiceId;
  await prisma.delivery.delete({ where: { id: delivery.id } });
  if (invoiceId) await recalcInvoiceTotals(invoiceId);
  return success(res, null, 'Delivery deleted');
}));

export default router;
