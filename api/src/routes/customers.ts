import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { authRequired, loadBusinessContext } from '../middleware/auth.js';
import { success, error, notFound, asyncHandler } from '../lib/response.js';
import { createCustomerSchema, updateCustomerSchema } from '../validators/customer.js';

const router = Router();

router.use(authRequired, loadBusinessContext);

// GET /api/v1/customers
router.get('/', asyncHandler(async (req, res) => {
  const { search, active } = req.query;
  const where: Record<string, unknown> = { businessId: req.user!.businessId! };

  if (search && typeof search === 'string') {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { phone: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
    ];
  }
  if (active === 'true') where.isActive = true;
  if (active === 'false') where.isActive = false;

  const customers = await prisma.customer.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  });
  return success(res, customers);
}));

// POST /api/v1/customers
router.post('/', asyncHandler(async (req, res) => {
  const input = createCustomerSchema.parse(req.body);
  const customer = await prisma.customer.create({
    data: { ...input, businessId: req.user!.businessId! },
  });
  return success(res, customer, 'Customer created', 201);
}));

// GET /api/v1/customers/:id
router.get('/:id', asyncHandler(async (req, res) => {
  const customer = await prisma.customer.findFirst({
    where: { id: req.params.id, businessId: req.user!.businessId! },
    include: {
      estimates: { orderBy: { createdAt: 'desc' }, take: 10 },
      invoices: { orderBy: { createdAt: 'desc' }, take: 10 },
      payments: { orderBy: { createdAt: 'desc' }, take: 10 },
      deliveries: { orderBy: { createdAt: 'desc' }, take: 10 },
    },
  });
  if (!customer) return notFound(res, 'Customer');
  return success(res, customer);
}));

// PATCH /api/v1/customers/:id
router.patch('/:id', asyncHandler(async (req, res) => {
  const input = updateCustomerSchema.parse(req.body);
  const customer = await prisma.customer.findFirst({
    where: { id: req.params.id, businessId: req.user!.businessId! },
  });
  if (!customer) return notFound(res, 'Customer');

  const updated = await prisma.customer.update({
    where: { id: req.params.id },
    data: input,
  });
  return success(res, updated, 'Customer updated');
}));

// DELETE /api/v1/customers/:id — deactivate (soft delete)
router.delete('/:id', asyncHandler(async (req, res) => {
  const customer = await prisma.customer.findFirst({
    where: { id: req.params.id, businessId: req.user!.businessId! },
  });
  if (!customer) return notFound(res, 'Customer');

  const updated = await prisma.customer.update({
    where: { id: req.params.id },
    data: { isActive: false },
  });
  return success(res, updated, 'Customer deactivated');
}));

// GET /api/v1/customers/:id/transactions
router.get('/:id/transactions', asyncHandler(async (req, res) => {
  const customerId = req.params.id;
  const businessId = req.user!.businessId!;

  const customer = await prisma.customer.findFirst({
    where: { id: customerId, businessId },
  });
  if (!customer) return notFound(res, 'Customer');

  const [estimates, invoices, payments, deliveries] = await Promise.all([
    prisma.estimate.findMany({ where: { customerId, businessId }, orderBy: { createdAt: 'desc' } }),
    prisma.invoice.findMany({ where: { customerId, businessId }, orderBy: { createdAt: 'desc' } }),
    prisma.payment.findMany({ where: { customerId, businessId }, orderBy: { createdAt: 'desc' } }),
    prisma.delivery.findMany({ where: { customerId, businessId }, orderBy: { createdAt: 'desc' } }),
  ]);

  const totalInvoiced = invoices.reduce((sum, i) => sum + Number(i.total), 0);
  const totalPaid = payments.reduce((sum, p) => sum + Number(p.amount), 0);
  const outstanding = totalInvoiced - totalPaid;

  return success(res, {
    estimates,
    invoices,
    payments,
    deliveries,
    summary: { totalInvoiced, totalPaid, outstanding },
  });
}));

export default router;
