import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { authRequired, loadBusinessContext } from '../middleware/auth.js';
import { success, error, notFound, asyncHandler } from '../lib/response.js';
import { createExpenseSchema, updateExpenseSchema } from '../validators/expense.js';

const router = Router();

router.use(authRequired, loadBusinessContext);

// GET /api/v1/expense-categories
router.get('/categories', asyncHandler(async (req, res) => {
  const categories = await prisma.expenseCategory.findMany({
    where: { businessId: req.user!.businessId! },
    orderBy: { name: 'asc' },
  });
  return success(res, categories);
}));

// POST /api/v1/expense-categories
router.post('/categories', asyncHandler(async (req, res) => {
  const { name } = req.body;
  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return error(res, 'VALIDATION', 'Category name is required');
  }
  const existing = await prisma.expenseCategory.findFirst({
    where: { businessId: req.user!.businessId!, name: name.trim() },
  });
  if (existing) return error(res, 'CONFLICT', 'Category already exists', 409);

  const category = await prisma.expenseCategory.create({
    data: { businessId: req.user!.businessId!, name: name.trim() },
  });
  return success(res, category, 'Category created', 201);
}));

// GET /api/v1/expenses
router.get('/', asyncHandler(async (req, res) => {
  const { categoryId, dateFrom, dateTo, groupBy } = req.query;
  const where: Record<string, unknown> = { businessId: req.user!.businessId! };

  if (categoryId && typeof categoryId === 'string') where.categoryId = categoryId;
  if (dateFrom && typeof dateFrom === 'string') {
    where.date = { ...(where.date as object || {}), gte: new Date(dateFrom) };
  }
  if (dateTo && typeof dateTo === 'string') {
    where.date = { ...(where.date as object || {}), lte: new Date(dateTo) };
  }

  const expenses = await prisma.expense.findMany({
    where,
    include: {
      category: { select: { id: true, name: true } },
    },
    orderBy: { date: 'desc' },
  });

  // If groupBy=category, return grouped totals
  if (groupBy === 'category') {
    const grouped = expenses.reduce((acc, e) => {
      const cat = e.category.name;
      if (!acc[cat]) acc[cat] = { category: cat, total: 0, count: 0, expenses: [] };
      acc[cat].total += Number(e.amount);
      acc[cat].count += 1;
      acc[cat].expenses.push(e);
      return acc;
    }, {} as Record<string, { category: string; total: number; count: number; expenses: typeof expenses }>);

    const groups = Object.values(grouped).sort((a, b) => b.total - a.total);
    const grandTotal = groups.reduce((sum, g) => sum + g.total, 0);
    return success(res, { groups, grandTotal: Number(grandTotal.toFixed(2)) });
  }

  const total = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
  return success(res, { expenses, total: Number(total.toFixed(2)) });
}));

// POST /api/v1/expenses
router.post('/', asyncHandler(async (req, res) => {
  const input = createExpenseSchema.parse(req.body);
  const businessId = req.user!.businessId!;

  const category = await prisma.expenseCategory.findFirst({
    where: { id: input.categoryId, businessId },
  });
  if (!category) return notFound(res, 'Category');

  const expense = await prisma.expense.create({
    data: {
      businessId,
      categoryId: input.categoryId,
      description: input.description,
      amount: input.amount,
      date: input.date ? new Date(input.date) : new Date(),
      vendor: input.vendor,
      paymentMethod: input.paymentMethod,
      reference: input.reference,
      notes: input.notes,
      createdById: req.user!.userId,
    },
    include: { category: true },
  });
  return success(res, expense, 'Expense recorded', 201);
}));

// GET /api/v1/expenses/:id
router.get('/:id', asyncHandler(async (req, res) => {
  const expense = await prisma.expense.findFirst({
    where: { id: req.params.id, businessId: req.user!.businessId! },
    include: { category: true },
  });
  if (!expense) return notFound(res, 'Expense');
  return success(res, expense);
}));

// PATCH /api/v1/expenses/:id
router.patch('/:id', asyncHandler(async (req, res) => {
  const input = updateExpenseSchema.parse(req.body);
  const businessId = req.user!.businessId!;

  const expense = await prisma.expense.findFirst({
    where: { id: req.params.id, businessId },
  });
  if (!expense) return notFound(res, 'Expense');

  if (input.categoryId) {
    const category = await prisma.expenseCategory.findFirst({
      where: { id: input.categoryId, businessId },
    });
    if (!category) return notFound(res, 'Category');
  }

  const updated = await prisma.expense.update({
    where: { id: req.params.id },
    data: {
      ...(input.categoryId ? { categoryId: input.categoryId } : {}),
      ...(input.description ? { description: input.description } : {}),
      ...(input.amount !== undefined ? { amount: input.amount } : {}),
      ...(input.date ? { date: new Date(input.date) } : {}),
      ...(input.vendor !== undefined ? { vendor: input.vendor } : {}),
      ...(input.paymentMethod ? { paymentMethod: input.paymentMethod } : {}),
      ...(input.reference !== undefined ? { reference: input.reference } : {}),
      ...(input.notes !== undefined ? { notes: input.notes } : {}),
    },
    include: { category: true },
  });
  return success(res, updated, 'Expense updated');
}));

// DELETE /api/v1/expenses/:id
router.delete('/:id', asyncHandler(async (req, res) => {
  const expense = await prisma.expense.findFirst({
    where: { id: req.params.id, businessId: req.user!.businessId! },
  });
  if (!expense) return notFound(res, 'Expense');

  await prisma.expense.delete({ where: { id: req.params.id } });
  return success(res, null, 'Expense deleted');
}));

export default router;
