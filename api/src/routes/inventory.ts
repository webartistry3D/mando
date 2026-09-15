import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { authRequired, loadBusinessContext } from '../middleware/auth.js';
import { success, error, notFound, asyncHandler } from '../lib/response.js';
import { stockTxnSchema } from '../validators/inventory.js';

const router = Router();

router.use(authRequired, loadBusinessContext);

// POST /api/v1/inventory/stock-in
router.post('/stock-in', asyncHandler(async (req, res) => {
  const input = stockTxnSchema.parse(req.body);
  const businessId = req.user!.businessId!;

  const product = await prisma.product.findFirst({
    where: { id: input.productId, businessId },
  });
  if (!product) return notFound(res, 'Product');

  const txn = await prisma.inventoryTransaction.create({
    data: {
      businessId,
      productId: input.productId,
      type: 'STOCK_IN',
      quantity: input.quantity,
      reason: input.reason,
      referenceType: input.referenceType,
      referenceId: input.referenceId,
      createdById: req.user!.userId,
    },
  });
  return success(res, txn, 'Stock added', 201);
}));

// POST /api/v1/inventory/stock-out
router.post('/stock-out', asyncHandler(async (req, res) => {
  const input = stockTxnSchema.parse(req.body);
  const businessId = req.user!.businessId!;

  const product = await prisma.product.findFirst({
    where: { id: input.productId, businessId },
  });
  if (!product) return notFound(res, 'Product');

  const txn = await prisma.inventoryTransaction.create({
    data: {
      businessId,
      productId: input.productId,
      type: 'STOCK_OUT',
      quantity: input.quantity,
      reason: input.reason,
      referenceType: input.referenceType,
      referenceId: input.referenceId,
      createdById: req.user!.userId,
    },
  });
  return success(res, txn, 'Stock removed', 201);
}));

// POST /api/v1/inventory/adjustment
router.post('/adjustment', asyncHandler(async (req, res) => {
  const input = stockTxnSchema.parse(req.body);
  const businessId = req.user!.businessId!;

  const product = await prisma.product.findFirst({
    where: { id: input.productId, businessId },
  });
  if (!product) return notFound(res, 'Product');

  const txn = await prisma.inventoryTransaction.create({
    data: {
      businessId,
      productId: input.productId,
      type: 'ADJUSTMENT',
      quantity: input.quantity,
      reason: input.reason,
      referenceType: input.referenceType,
      referenceId: input.referenceId,
      createdById: req.user!.userId,
    },
  });
  return success(res, txn, 'Adjustment recorded', 201);
}));

// GET /api/v1/inventory/transactions — business-wide transaction history
router.get('/transactions', asyncHandler(async (req, res) => {
  const businessId = req.user!.businessId!;
  const { productId, type, page, limit } = req.query;

  const where: Record<string, unknown> = { businessId };
  if (productId && typeof productId === 'string') where.productId = productId;
  if (type && typeof type === 'string') where.type = type;

  const pageNum = Math.max(1, Number(page) || 1);
  const limitNum = Math.min(100, Math.max(1, Number(limit) || 50));

  const [txns, total] = await Promise.all([
    prisma.inventoryTransaction.findMany({
      where,
      include: {
        product: { select: { id: true, name: true, sku: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (pageNum - 1) * limitNum,
      take: limitNum,
    }),
    prisma.inventoryTransaction.count({ where }),
  ]);

  return success(res, {
    transactions: txns,
    pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) },
  });
}));

export default router;
