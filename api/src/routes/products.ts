import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { authRequired, loadBusinessContext } from '../middleware/auth.js';
import { success, error, notFound, asyncHandler } from '../lib/response.js';
import { createProductSchema, updateProductSchema } from '../validators/product.js';

const router = Router();

router.use(authRequired, loadBusinessContext);

// GET /api/v1/products
router.get('/', asyncHandler(async (req, res) => {
  const { search, type, active } = req.query;
  const where: Record<string, unknown> = { businessId: req.user!.businessId! };

  if (search && typeof search === 'string') {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { sku: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
    ];
  }
  if (type === 'PRODUCT' || type === 'SERVICE') where.type = type;
  if (active === 'true') where.isActive = true;
  if (active === 'false') where.isActive = false;

  const products = await prisma.product.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: {
      inventoryTxns: {
        orderBy: { createdAt: 'desc' },
        take: 5,
      },
    },
  });

  // Calculate stock level for each product
  const withStock = products.map((p) => {
    const stock = p.inventoryTxns.reduce((sum, t) => {
      if (t.type === 'STOCK_IN') return sum + t.quantity;
      if (t.type === 'STOCK_OUT') return sum - t.quantity;
      if (t.type === 'ADJUSTMENT') return sum + t.quantity;
      return sum;
    }, p.openingStock);
    const { inventoryTxns, ...rest } = p;
    return { ...rest, stock };
  });

  return success(res, withStock);
}));

// POST /api/v1/products
router.post('/', asyncHandler(async (req, res) => {
  const input = createProductSchema.parse(req.body);

  // SKU uniqueness within business
  if (input.sku) {
    const existing = await prisma.product.findFirst({
      where: { businessId: req.user!.businessId!, sku: input.sku },
    });
    if (existing) {
      return error(res, 'CONFLICT', `Product with SKU "${input.sku}" already exists`, 409);
    }
  }

  const product = await prisma.product.create({
    data: { ...input, businessId: req.user!.businessId! },
  });
  return success(res, product, 'Product created', 201);
}));

// GET /api/v1/products/:id
router.get('/:id', asyncHandler(async (req, res) => {
  const product = await prisma.product.findFirst({
    where: { id: req.params.id, businessId: req.user!.businessId! },
    include: {
      inventoryTxns: { orderBy: { createdAt: 'desc' }, take: 20 },
    },
  });
  if (!product) return notFound(res, 'Product');

  const stock = product.inventoryTxns.reduce((sum, t) => {
    if (t.type === 'STOCK_IN') return sum + t.quantity;
    if (t.type === 'STOCK_OUT') return sum - t.quantity;
    if (t.type === 'ADJUSTMENT') return sum + t.quantity;
    return sum;
  }, product.openingStock);

  const { inventoryTxns, ...rest } = product;
  return success(res, { ...rest, stock });
}));

// PATCH /api/v1/products/:id
router.patch('/:id', asyncHandler(async (req, res) => {
  const input = updateProductSchema.parse(req.body);
  const product = await prisma.product.findFirst({
    where: { id: req.params.id, businessId: req.user!.businessId! },
  });
  if (!product) return notFound(res, 'Product');

  // SKU uniqueness check if changing
  if (input.sku && input.sku !== product.sku) {
    const existing = await prisma.product.findFirst({
      where: { businessId: req.user!.businessId!, sku: input.sku, NOT: { id: req.params.id } },
    });
    if (existing) {
      return error(res, 'CONFLICT', `Product with SKU "${input.sku}" already exists`, 409);
    }
  }

  const updated = await prisma.product.update({
    where: { id: req.params.id },
    data: input,
  });
  return success(res, updated, 'Product updated');
}));

// DELETE /api/v1/products/:id — deactivate
router.delete('/:id', asyncHandler(async (req, res) => {
  const product = await prisma.product.findFirst({
    where: { id: req.params.id, businessId: req.user!.businessId! },
  });
  if (!product) return notFound(res, 'Product');

  const updated = await prisma.product.update({
    where: { id: req.params.id },
    data: { isActive: false },
  });
  return success(res, updated, 'Product deactivated');
}));

// GET /api/v1/products/:id/inventory — full transaction history for this product
router.get('/:id/inventory', asyncHandler(async (req, res) => {
  const product = await prisma.product.findFirst({
    where: { id: req.params.id, businessId: req.user!.businessId! },
  });
  if (!product) return notFound(res, 'Product');

  const txns = await prisma.inventoryTransaction.findMany({
    where: { productId: req.params.id, businessId: req.user!.businessId! },
    orderBy: { createdAt: 'desc' },
  });

  const stock = txns.reduce((sum, t) => {
    if (t.type === 'STOCK_IN') return sum + t.quantity;
    if (t.type === 'STOCK_OUT') return sum - t.quantity;
    if (t.type === 'ADJUSTMENT') return sum + t.quantity;
    return sum;
  }, product.openingStock);

  return success(res, { product: { id: product.id, name: product.name, sku: product.sku, openingStock: product.openingStock, lowStockThreshold: product.lowStockThreshold }, stock, transactions: txns });
}));

export default router;
