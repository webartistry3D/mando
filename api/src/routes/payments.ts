import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { authRequired, loadBusinessContext } from '../middleware/auth.js';
import { success, error, notFound, asyncHandler } from '../lib/response.js';
import { createPaymentSchema, updatePaymentSchema } from '../validators/payment.js';

const router = Router();

router.use(authRequired, loadBusinessContext);

// GET /api/v1/payments
router.get('/', asyncHandler(async (req, res) => {
  const { invoiceId, customerId, dateFrom, dateTo } = req.query;
  const where: Record<string, unknown> = { businessId: req.user!.businessId! };

  if (invoiceId && typeof invoiceId === 'string') where.invoiceId = invoiceId;
  if (customerId && typeof customerId === 'string') where.customerId = customerId;
  if (dateFrom && typeof dateFrom === 'string') {
    where.paymentDate = { ...(where.paymentDate as object || {}), gte: new Date(dateFrom) };
  }
  if (dateTo && typeof dateTo === 'string') {
    where.paymentDate = { ...(where.paymentDate as object || {}), lte: new Date(dateTo) };
  }

  const payments = await prisma.payment.findMany({
    where,
    include: {
      invoice: { select: { id: true, number: true, total: true, status: true } },
      customer: { select: { id: true, name: true } },
    },
    orderBy: { paymentDate: 'desc' },
  });
  return success(res, payments);
}));

// POST /api/v1/payments — record a payment
router.post('/', asyncHandler(async (req, res) => {
  const input = createPaymentSchema.parse(req.body);
  const businessId = req.user!.businessId!;

  // If invoiceId provided, verify it and check for overpayment
  if (input.invoiceId) {
    const invoice = await prisma.invoice.findFirst({
      where: { id: input.invoiceId, businessId },
      include: { payments: true },
    });
    if (!invoice) return notFound(res, 'Invoice');
    if (invoice.status === 'CANCELLED' || invoice.status === 'DRAFT') {
      return error(res, 'FORBIDDEN', `Cannot record payment on a ${invoice.status.toLowerCase()} invoice`, 400);
    }

    const paidSoFar = invoice.payments.reduce((sum, p) => sum + Number(p.amount), 0);
    const remaining = Number(invoice.total) - paidSoFar;
    if (input.amount > remaining) {
      return error(res, 'OVERPAYMENT', `Payment exceeds remaining balance of ₦${remaining.toFixed(2)}`, 400);
    }

    // Auto-set customerId from invoice if not provided
    if (!input.customerId && invoice.customerId) {
      input.customerId = invoice.customerId;
    }
  }

  // Verify customer if provided
  if (input.customerId) {
    const customer = await prisma.customer.findFirst({
      where: { id: input.customerId, businessId },
    });
    if (!customer) return notFound(res, 'Customer');
  }

  const payment = await prisma.$transaction(async (tx) => {
    const p = await tx.payment.create({
      data: {
        businessId,
        invoiceId: input.invoiceId || null,
        customerId: input.customerId || null,
        amount: input.amount,
        paymentMethod: input.paymentMethod,
        paymentDate: input.paymentDate ? new Date(input.paymentDate) : new Date(),
        reference: input.reference,
        description: input.description,
        notes: input.notes,
        createdById: req.user!.userId,
      },
      include: {
        invoice: { select: { id: true, number: true, total: true } },
        customer: { select: { id: true, name: true } },
      },
    });

    // Update invoice amountPaid, balanceDue, and status if linked
    if (input.invoiceId) {
      const invoice = await tx.invoice.findFirst({
        where: { id: input.invoiceId, businessId },
        include: { payments: true },
      });
      if (invoice) {
        const totalPaid = invoice.payments.reduce((sum, p) => sum + Number(p.amount), 0);
        const balanceDue = Number(invoice.total) - totalPaid;
        let newStatus = invoice.status;
        if (balanceDue <= 0) newStatus = 'PAID';
        else if (totalPaid > 0 && invoice.status === 'ISSUED') newStatus = 'PARTIALLY_PAID';

        await tx.invoice.update({
          where: { id: input.invoiceId },
          data: {
            amountPaid: totalPaid,
            balanceDue: Math.max(0, balanceDue),
            status: newStatus,
          },
        });
      }
    }

    return p;
  });

  return success(res, payment, 'Payment recorded', 201);
}));

// GET /api/v1/payments/:id
router.get('/:id', asyncHandler(async (req, res) => {
  const payment = await prisma.payment.findFirst({
    where: { id: req.params.id, businessId: req.user!.businessId! },
    include: {
      invoice: { select: { id: true, number: true, total: true, status: true, balanceDue: true } },
      customer: { select: { id: true, name: true, phone: true, email: true } },
    },
  });
  if (!payment) return notFound(res, 'Payment');
  return success(res, payment);
}));

// PATCH /api/v1/payments/:id
router.patch('/:id', asyncHandler(async (req, res) => {
  const input = updatePaymentSchema.parse(req.body);
  const businessId = req.user!.businessId!;

  const payment = await prisma.payment.findFirst({
    where: { id: req.params.id, businessId },
  });
  if (!payment) return notFound(res, 'Payment');

  const updated = await prisma.payment.update({
    where: { id: req.params.id },
    data: {
      ...(input.amount !== undefined ? { amount: input.amount } : {}),
      ...(input.paymentMethod ? { paymentMethod: input.paymentMethod } : {}),
      ...(input.paymentDate ? { paymentDate: new Date(input.paymentDate) } : {}),
      ...(input.reference !== undefined ? { reference: input.reference } : {}),
      ...(input.description !== undefined ? { description: input.description } : {}),
      ...(input.notes !== undefined ? { notes: input.notes } : {}),
    },
    include: {
      invoice: { select: { id: true, number: true, total: true } },
      customer: { select: { id: true, name: true } },
    },
  });

  // Recalculate invoice totals if linked
  if (payment.invoiceId) {
    const invoice = await prisma.invoice.findFirst({
      where: { id: payment.invoiceId, businessId },
      include: { payments: true },
    });
    if (invoice) {
      const totalPaid = invoice.payments.reduce((sum, p) => sum + Number(p.amount), 0);
      const balanceDue = Number(invoice.total) - totalPaid;
      let newStatus = invoice.status;
      if (balanceDue <= 0) newStatus = 'PAID';
      else if (totalPaid > 0 && invoice.status === 'ISSUED') newStatus = 'PARTIALLY_PAID';

      await prisma.invoice.update({
        where: { id: payment.invoiceId },
        data: {
          amountPaid: totalPaid,
          balanceDue: Math.max(0, balanceDue),
          status: newStatus,
        },
      });
    }
  }

  return success(res, updated, 'Payment updated');
}));

// DELETE /api/v1/payments/:id
router.delete('/:id', asyncHandler(async (req, res) => {
  const businessId = req.user!.businessId!;
  const payment = await prisma.payment.findFirst({
    where: { id: req.params.id, businessId },
  });
  if (!payment) return notFound(res, 'Payment');

  await prisma.$transaction(async (tx) => {
    await tx.payment.delete({ where: { id: payment.id } });

    // Recalculate invoice totals
    if (payment.invoiceId) {
      const invoice = await tx.invoice.findFirst({
        where: { id: payment.invoiceId, businessId },
        include: { payments: true },
      });
      if (invoice) {
        const totalPaid = invoice.payments.reduce((sum, p) => sum + Number(p.amount), 0);
        const balanceDue = Number(invoice.total) - totalPaid;
        let newStatus = invoice.status;
        if (balanceDue <= 0) newStatus = 'PAID';
        else if (totalPaid > 0) newStatus = 'PARTIALLY_PAID';
        else newStatus = 'ISSUED';

        await tx.invoice.update({
          where: { id: payment.invoiceId },
          data: {
            amountPaid: totalPaid,
            balanceDue: Math.max(0, balanceDue),
            status: newStatus,
          },
        });
      }
    }
  });

  return success(res, null, 'Payment deleted');
}));

export default router;
