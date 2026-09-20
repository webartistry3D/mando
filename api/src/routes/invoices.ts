import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { authRequired, loadBusinessContext } from '../middleware/auth.js';
import { success, error, notFound, asyncHandler } from '../lib/response.js';
import { createInvoiceSchema, updateInvoiceSchema } from '../validators/invoice.js';
import type { InvoiceStatus } from '@prisma/client';

const router = Router();

router.use(authRequired, loadBusinessContext);

async function nextInvoiceNumber(businessId: string): Promise<string> {
  const settings = await prisma.businessSettings.findUnique({ where: { businessId } });
  const prefix = settings?.invoicePrefix || 'INV';
  const last = await prisma.invoice.findFirst({
    where: { businessId },
    orderBy: { createdAt: 'desc' },
    select: { number: true },
  });
  const seq = last ? parseInt(last.number.replace(/\D/g, ''), 10) + 1 : 1;
  return `${prefix}-${String(seq).padStart(3, '0')}`;
}

function calcTotals(items: Array<{ quantity: number; unitPrice: number; discount: number; tax: number }>, docDiscount: number, docTax: number, deliveryFee = 0) {
  const subtotal = items.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0);
  const lineDiscount = items.reduce((sum, i) => sum + i.discount, 0);
  const lineTax = items.reduce((sum, i) => sum + i.tax, 0);
  const discount = lineDiscount + docDiscount;
  const tax = lineTax + docTax;
  const total = subtotal - discount + tax + deliveryFee;
  return {
    subtotal: Number(subtotal.toFixed(2)),
    discount: Number(discount.toFixed(2)),
    tax: Number(tax.toFixed(2)),
    total: Number(total.toFixed(2)),
  };
}

// Recalculate an invoice's stored totals from its line items + linked delivery fees.
// Used by the deliveries route to keep invoice totals in sync when delivery fees change.
export async function recalcInvoiceTotals(invoiceId: string) {
  const invoice = await prisma.invoice.findFirst({
    where: { id: invoiceId },
    include: { items: true, payments: true, deliveries: { select: { deliveryFee: true } } },
  });
  if (!invoice) return;
  const deliveryFee = Number(invoice.deliveryFee || 0);
  const { subtotal, discount, tax, total } = calcTotals(
    invoice.items.map((i) => ({
      quantity: i.quantity,
      unitPrice: Number(i.unitPrice),
      discount: Number(i.discount),
      tax: Number(i.tax),
    })),
    Number(invoice.discount) - invoice.items.reduce((s, i) => s + Number(i.discount), 0),
    Number(invoice.tax) - invoice.items.reduce((s, i) => s + Number(i.tax), 0),
    deliveryFee,
  );
  const amountPaid = Number(invoice.payments.reduce((s, p) => s + Number(p.amount), 0).toFixed(2));
  const balanceDue = Number(Math.max(0, total - amountPaid).toFixed(2));
  await prisma.invoice.update({
    where: { id: invoiceId },
    data: { subtotal, discount, tax, total, amountPaid, balanceDue },
  });
}

// GET /api/v1/invoices
router.get('/', asyncHandler(async (req, res) => {
  const { status, customerId, search, dateFrom, dateTo } = req.query;
  const where: Record<string, unknown> = { businessId: req.user!.businessId! };

  if (status && typeof status === 'string') where.status = status;
  if (customerId && typeof customerId === 'string') where.customerId = customerId;
  if (search && typeof search === 'string') {
    where.OR = [
      { number: { contains: search, mode: 'insensitive' } },
      { customer: { name: { contains: search, mode: 'insensitive' } } },
    ];
  }
  if (dateFrom && typeof dateFrom === 'string') {
    where.createdAt = { ...(where.createdAt as object || {}), gte: new Date(dateFrom) };
  }
  if (dateTo && typeof dateTo === 'string') {
    where.createdAt = { ...(where.createdAt as object || {}), lte: new Date(dateTo) };
  }

  const invoices = await prisma.invoice.findMany({
    where,
    include: {
      customer: { select: { id: true, name: true, phone: true } },
      items: true,
      payments: { orderBy: { createdAt: 'desc' } },
    },
    orderBy: { createdAt: 'desc' },
  });
  return success(res, invoices);
}));

// POST /api/v1/invoices
router.post('/', asyncHandler(async (req, res) => {
  const input = createInvoiceSchema.parse(req.body);
  const businessId = req.user!.businessId!;

  // Verify customer if provided
  if (input.customerId) {
    const customer = await prisma.customer.findFirst({
      where: { id: input.customerId, businessId },
    });
    if (!customer) return notFound(res, 'Customer');
  }

  const number = input.number || await nextInvoiceNumber(businessId);
  const { subtotal, discount, tax, total } = calcTotals(input.items, input.discount || 0, input.tax || 0);

  const invoice = await prisma.invoice.create({
    data: {
      businessId,
      customerId: input.customerId || null,
      number,
      status: 'DRAFT',
      issueDate: input.issueDate ? new Date(input.issueDate) : new Date(),
      dueDate: input.dueDate ? new Date(input.dueDate) : undefined,
      subtotal,
      discount,
      tax,
      deliveryFee: 0,
      total,
      amountPaid: 0,
      balanceDue: total,
      notes: input.notes,
      paymentInstructions: input.paymentInstructions,
      createdById: req.user!.userId,
      items: {
        create: input.items.map((item) => ({
          productId: item.productId || undefined,
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          discount: item.discount || 0,
          tax: item.tax || 0,
          lineTotal: Number((item.quantity * item.unitPrice - (item.discount || 0) + (item.tax || 0)).toFixed(2)),
        })),
      },
    },
    include: { customer: true, items: true },
  });

  return success(res, invoice, 'Invoice created', 201);
}));

// GET /api/v1/invoices/:id
router.get('/:id', asyncHandler(async (req, res) => {
  const invoice = await prisma.invoice.findFirst({
    where: { id: req.params.id, businessId: req.user!.businessId! },
    include: {
      customer: true,
      items: { include: { product: { select: { id: true, name: true, sku: true } } } },
      payments: { orderBy: { createdAt: 'desc' } },
      deliveries: true,
      estimate: { select: { id: true, number: true } },
    },
  });
  if (!invoice) return notFound(res, 'Invoice');
  return success(res, invoice);
}));

// PATCH /api/v1/invoices/:id
router.patch('/:id', asyncHandler(async (req, res) => {
  const input = updateInvoiceSchema.parse(req.body);
  const businessId = req.user!.businessId!;

  const invoice = await prisma.invoice.findFirst({
    where: { id: req.params.id, businessId },
    include: { items: true },
  });
  if (!invoice) return notFound(res, 'Invoice');

  // Can only edit items on DRAFT invoices
  if (invoice.status !== 'DRAFT' && input.items) {
    return error(res, 'FORBIDDEN', 'Cannot modify items on a non-draft invoice', 400);
  }

  // Status transitions validation
  const validTransitions: Record<InvoiceStatus, InvoiceStatus[]> = {
    DRAFT: ['ISSUED', 'CANCELLED'],
    ISSUED: ['PARTIALLY_PAID', 'PAID', 'OVERDUE', 'CANCELLED'],
    PARTIALLY_PAID: ['PAID', 'OVERDUE', 'CANCELLED'],
    PAID: [],
    OVERDUE: ['PARTIALLY_PAID', 'PAID', 'CANCELLED'],
    CANCELLED: [],
  };

  if (input.status && !validTransitions[invoice.status].includes(input.status)) {
    return error(res, 'INVALID_TRANSITION', `Cannot transition from ${invoice.status} to ${input.status}`, 400);
  }

  const items = input.items || invoice.items;
  const oldLineDiscount = invoice.items.reduce((s, i) => s + Number(i.discount), 0);
  const oldLineTax = invoice.items.reduce((s, i) => s + Number(i.tax), 0);
  const docDiscount = input.discount !== undefined ? input.discount : Number(invoice.discount) - oldLineDiscount;
  const docTax = input.tax !== undefined ? input.tax : Number(invoice.tax) - oldLineTax;

  // Include linked delivery fees in the invoice total
  const linkedDeliveries = await prisma.delivery.findMany({
    where: { invoiceId: invoice.id },
    select: { deliveryFee: true },
  });
  const deliveryFee = Number(invoice.deliveryFee || 0);
  void linkedDeliveries;

  const { subtotal, discount, tax, total } = calcTotals(
    items.map((i) => ({
      quantity: i.quantity,
      unitPrice: typeof i.unitPrice === 'object' ? Number(i.unitPrice) : i.unitPrice,
      discount: typeof i.discount === 'object' ? Number(i.discount) : i.discount,
      tax: typeof i.tax === 'object' ? Number(i.tax) : i.tax,
    })),
    docDiscount,
    docTax,
    deliveryFee,
  );

  const updated = await prisma.$transaction(async (tx) => {
    if (input.items) {
      await tx.invoiceItem.deleteMany({ where: { invoiceId: invoice.id } });
      await tx.invoiceItem.createMany({
        data: input.items.map((item) => ({
          invoiceId: invoice.id,
          productId: item.productId || undefined,
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          discount: item.discount || 0,
          tax: item.tax || 0,
          lineTotal: Number((item.quantity * item.unitPrice - (item.discount || 0) + (item.tax || 0)).toFixed(2)),
        })),
      });
    }

    return tx.invoice.update({
      where: { id: invoice.id },
      data: {
        ...(input.customerId !== undefined ? { customerId: input.customerId || null } : {}),
        ...(input.issueDate ? { issueDate: new Date(input.issueDate) } : {}),
        ...(input.dueDate ? { dueDate: new Date(input.dueDate) } : {}),
        subtotal,
        discount,
        tax,
        total,
        ...(invoice.deliveryFee !== undefined ? { deliveryFee: invoice.deliveryFee } : {}),
        ...(input.notes !== undefined ? { notes: input.notes } : {}),
        ...(input.paymentInstructions !== undefined ? { paymentInstructions: input.paymentInstructions } : {}),
        ...(input.status ? { status: input.status } : {}),
      },
      include: { customer: true, items: true, payments: true },
    });
  });

  return success(res, updated, 'Invoice updated');
}));

// DELETE /api/v1/invoices/:id — only drafts
router.delete('/:id', asyncHandler(async (req, res) => {
  const invoice = await prisma.invoice.findFirst({
    where: { id: req.params.id, businessId: req.user!.businessId! },
  });
  if (!invoice) return notFound(res, 'Invoice');
  if (invoice.status !== 'DRAFT') {
    return error(res, 'FORBIDDEN', 'Only draft invoices can be deleted', 400);
  }

  await prisma.invoice.delete({ where: { id: invoice.id } });
  return success(res, null, 'Invoice deleted');
}));

// POST /api/v1/invoices/:id/issue — mark as issued (DRAFT → ISSUED)
router.post('/:id/issue', asyncHandler(async (req, res) => {
  const invoice = await prisma.invoice.findFirst({
    where: { id: req.params.id, businessId: req.user!.businessId! },
  });
  if (!invoice) return notFound(res, 'Invoice');
  if (invoice.status !== 'DRAFT') {
    return error(res, 'FORBIDDEN', 'Only draft invoices can be issued', 400);
  }

  const updated = await prisma.invoice.update({
    where: { id: invoice.id },
    data: { status: 'ISSUED', issueDate: new Date() },
    include: { customer: true, items: true },
  });
  return success(res, updated, 'Invoice issued');
}));

export default router;
