import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { authRequired, loadBusinessContext } from '../middleware/auth.js';
import { success, error, notFound, asyncHandler } from '../lib/response.js';
import { createEstimateSchema, updateEstimateSchema } from '../validators/estimate.js';

const router = Router();

router.use(authRequired, loadBusinessContext);

// Sequential number generation per business
async function nextNumber(businessId: string, prefix: string): Promise<string> {
  const last = await prisma.estimate.findFirst({
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

// GET /api/v1/estimates
router.get('/', asyncHandler(async (req, res) => {
  const { status, customerId, search } = req.query;
  const where: Record<string, unknown> = { businessId: req.user!.businessId! };

  if (status && typeof status === 'string') where.status = status;
  if (customerId && typeof customerId === 'string') where.customerId = customerId;
  if (search && typeof search === 'string') {
    where.OR = [
      { number: { contains: search, mode: 'insensitive' } },
      { customer: { name: { contains: search, mode: 'insensitive' } } },
    ];
  }

  const estimates = await prisma.estimate.findMany({
    where,
    include: {
      customer: { select: { id: true, name: true, phone: true } },
      items: true,
    },
    orderBy: { createdAt: 'desc' },
  });
  return success(res, estimates);
}));

// POST /api/v1/estimates
router.post('/', asyncHandler(async (req, res) => {
  const input = createEstimateSchema.parse(req.body);
  const businessId = req.user!.businessId!;

  // Verify customer belongs to this business
  const customer = await prisma.customer.findFirst({
    where: { id: input.customerId, businessId },
  });
  if (!customer) return notFound(res, 'Customer');

  // Get prefix from settings
  const settings = await prisma.businessSettings.findUnique({ where: { businessId } });
  const number = input.number || await nextNumber(businessId, settings?.estimatePrefix || 'EST');

  const { subtotal, discount, tax, total } = calcTotals(input.items, input.discount || 0, input.tax || 0, input.deliveryFee || 0);

  const estimate = await prisma.estimate.create({
    data: {
      businessId,
      customerId: input.customerId,
      number,
      status: 'DRAFT',
      issueDate: input.issueDate ? new Date(input.issueDate) : new Date(),
      expiryDate: input.expiryDate ? new Date(input.expiryDate) : undefined,
      subtotal,
      discount,
      tax,
      deliveryFee: input.deliveryFee || 0,
      total,
      notes: input.notes,
      terms: input.terms,
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

  return success(res, estimate, 'Estimate created', 201);
}));

// GET /api/v1/estimates/:id
router.get('/:id', asyncHandler(async (req, res) => {
  const estimate = await prisma.estimate.findFirst({
    where: { id: req.params.id, businessId: req.user!.businessId! },
    include: {
      customer: true,
      items: { include: { product: { select: { id: true, name: true, sku: true } } } },
      invoices: true,
    },
  });
  if (!estimate) return notFound(res, 'Estimate');
  return success(res, estimate);
}));

// PATCH /api/v1/estimates/:id
router.patch('/:id', asyncHandler(async (req, res) => {
  const input = updateEstimateSchema.parse(req.body);
  const businessId = req.user!.businessId!;

  const estimate = await prisma.estimate.findFirst({
    where: { id: req.params.id, businessId },
    include: { items: true },
  });
  if (!estimate) return notFound(res, 'Estimate');

  // Only allow editing DRAFT estimates (or status-only changes for non-draft)
  if (estimate.status !== 'DRAFT' && input.items) {
    return error(res, 'FORBIDDEN', 'Cannot modify items on a non-draft estimate', 400);
  }

  const items = input.items || estimate.items;
  const oldLineDiscount = estimate.items.reduce((s, i) => s + Number(i.discount), 0);
  const oldLineTax = estimate.items.reduce((s, i) => s + Number(i.tax), 0);
  const docDiscount = input.discount !== undefined ? input.discount : Number(estimate.discount) - oldLineDiscount;
  const docTax = input.tax !== undefined ? input.tax : Number(estimate.tax) - oldLineTax;

  const { subtotal, discount, tax, total } = calcTotals(
    items.map((i) => ({
      quantity: i.quantity,
      unitPrice: typeof i.unitPrice === 'object' ? Number(i.unitPrice) : i.unitPrice,
      discount: typeof i.discount === 'object' ? Number(i.discount) : i.discount,
      tax: typeof i.tax === 'object' ? Number(i.tax) : i.tax,
    })),
    docDiscount,
    docTax,
    input.deliveryFee !== undefined ? input.deliveryFee : Number(estimate.deliveryFee),
  );

  const updated = await prisma.$transaction(async (tx) => {
    // Replace items if provided
    if (input.items) {
      await tx.estimateItem.deleteMany({ where: { estimateId: estimate.id } });
      await tx.estimateItem.createMany({
        data: input.items.map((item) => ({
          estimateId: estimate.id,
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

    return tx.estimate.update({
      where: { id: estimate.id },
      data: {
        ...(input.customerId ? { customerId: input.customerId } : {}),
        ...(input.issueDate ? { issueDate: new Date(input.issueDate) } : {}),
        ...(input.expiryDate ? { expiryDate: new Date(input.expiryDate) } : {}),
        subtotal,
        discount,
        tax,
        deliveryFee: input.deliveryFee !== undefined ? input.deliveryFee : Number(estimate.deliveryFee),
        total,
        ...(input.notes !== undefined ? { notes: input.notes } : {}),
        ...(input.terms !== undefined ? { terms: input.terms } : {}),
        ...(input.status ? { status: input.status } : {}),
      },
      include: { customer: true, items: true },
    });
  });

  return success(res, updated, 'Estimate updated');
}));

// DELETE /api/v1/estimates/:id — only drafts
router.delete('/:id', asyncHandler(async (req, res) => {
  const estimate = await prisma.estimate.findFirst({
    where: { id: req.params.id, businessId: req.user!.businessId! },
  });
  if (!estimate) return notFound(res, 'Estimate');
  if (estimate.status !== 'DRAFT') {
    return error(res, 'FORBIDDEN', 'Only draft estimates can be deleted', 400);
  }

  await prisma.estimate.delete({ where: { id: estimate.id } });
  return success(res, null, 'Estimate deleted');
}));

// POST /api/v1/estimates/:id/convert — convert estimate to invoice
router.post('/:id/convert', asyncHandler(async (req, res) => {
  const businessId = req.user!.businessId!;

  const estimate = await prisma.estimate.findFirst({
    where: { id: req.params.id, businessId },
    include: { items: true },
  });
  if (!estimate) return notFound(res, 'Estimate');
  if (estimate.status !== 'ACCEPTED') {
    return error(res, 'FORBIDDEN', 'Only accepted estimates can be converted', 400);
  }

  const settings = await prisma.businessSettings.findUnique({ where: { businessId } });
  const invoicePrefix = settings?.invoicePrefix || 'INV';
  const lastInvoice = await prisma.invoice.findFirst({
    where: { businessId },
    orderBy: { createdAt: 'desc' },
    select: { number: true },
  });
  const seq = lastInvoice ? parseInt(lastInvoice.number.replace(/\D/g, ''), 10) + 1 : 1;
  const invoiceNumber = `${invoicePrefix}-${String(seq).padStart(3, '0')}`;

  const { subtotal, discount, tax, total } = calcTotals(
    estimate.items.map((item) => ({
      quantity: Number(item.quantity),
      unitPrice: Number(item.unitPrice),
      discount: Number(item.discount),
      tax: Number(item.tax),
    })),
    0,
    0,
    Number(estimate.deliveryFee),
  );

  const invoice = await prisma.invoice.create({
    data: {
      businessId,
      customerId: estimate.customerId,
      estimateId: estimate.id,
      number: invoiceNumber,
      status: 'ISSUED',
      issueDate: new Date(),
      subtotal,
      discount,
      tax,
      total,
      balanceDue: total,
      notes: estimate.notes,
      createdById: req.user!.userId,
      items: {
        create: estimate.items.map((item) => ({
          productId: item.productId,
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          discount: item.discount,
          tax: item.tax,
          lineTotal: item.lineTotal,
        })),
      },
    },
    include: { customer: true, items: true },
  });

  // Mark estimate as converted
  await prisma.estimate.update({
    where: { id: estimate.id },
    data: { status: 'CONVERTED' },
  });

  return success(res, invoice, 'Estimate converted to invoice', 201);
}));

export default router;
