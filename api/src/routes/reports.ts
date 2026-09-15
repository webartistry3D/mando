import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { authRequired, loadBusinessContext } from '../middleware/auth.js';
import { success, asyncHandler } from '../lib/response.js';

const router = Router();

router.use(authRequired, loadBusinessContext);

function parseDateRange(req: { query: Record<string, unknown> }) {
  const { dateFrom, dateTo } = req.query;
  const from = dateFrom ? new Date(dateFrom as string) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const to = dateTo ? new Date(dateTo as string) : new Date();
  return { from, to };
}

// GET /api/v1/reports/sales
router.get('/sales', asyncHandler(async (req, res) => {
  const { from, to } = parseDateRange(req);
  const businessId = req.user!.businessId!;

  const invoices = await prisma.invoice.findMany({
    where: {
      businessId,
      status: { notIn: ['DRAFT', 'CANCELLED'] },
      createdAt: { gte: from, lte: to },
    },
    include: { customer: { select: { name: true } }, items: true },
    orderBy: { createdAt: 'desc' },
  });

  const payments = await prisma.payment.findMany({
    where: { businessId, paymentDate: { gte: from, lte: to } },
    include: { invoice: { select: { number: true } }, customer: { select: { name: true } } },
    orderBy: { paymentDate: 'desc' },
  });

  const totalInvoiced = invoices.reduce((sum, i) => sum + Number(i.total), 0);
  const totalCollected = payments.reduce((sum, p) => sum + Number(p.amount), 0);
  const totalOutstanding = invoices.reduce((sum, i) => sum + Number(i.balanceDue), 0);

  // Group by day for chart data
  const byDay = invoices.reduce((acc, i) => {
    const day = i.createdAt.toISOString().split('T')[0];
    if (!acc[day]) acc[day] = { date: day, invoiced: 0, collected: 0 };
    acc[day].invoiced += Number(i.total);
    return acc;
  }, {} as Record<string, { date: string; invoiced: number; collected: number }>);

  payments.forEach((p) => {
    const day = p.paymentDate.toISOString().split('T')[0];
    if (!byDay[day]) byDay[day] = { date: day, invoiced: 0, collected: 0 };
    byDay[day].collected += Number(p.amount);
  });

  return success(res, {
    period: { from, to },
    summary: {
      invoiceCount: invoices.length,
      totalInvoiced: Number(totalInvoiced.toFixed(2)),
      paymentCount: payments.length,
      totalCollected: Number(totalCollected.toFixed(2)),
      totalOutstanding: Number(totalOutstanding.toFixed(2)),
    },
    byDay: Object.values(byDay).sort((a, b) => a.date.localeCompare(b.date)),
    invoices,
    payments,
  });
}));

// GET /api/v1/reports/expenses
router.get('/expenses', asyncHandler(async (req, res) => {
  const { from, to } = parseDateRange(req);
  const businessId = req.user!.businessId!;

  const expenses = await prisma.expense.findMany({
    where: { businessId, date: { gte: from, lte: to } },
    include: { category: { select: { name: true } } },
    orderBy: { date: 'desc' },
  });

  const total = expenses.reduce((sum, e) => sum + Number(e.amount), 0);

  const byCategory = expenses.reduce((acc, e) => {
    const cat = e.category.name;
    if (!acc[cat]) acc[cat] = { category: cat, total: 0, count: 0 };
    acc[cat].total += Number(e.amount);
    acc[cat].count += 1;
    return acc;
  }, {} as Record<string, { category: string; total: number; count: number }>);

  const byDay = expenses.reduce((acc, e) => {
    const day = e.date.toISOString().split('T')[0];
    if (!acc[day]) acc[day] = { date: day, total: 0 };
    acc[day].total += Number(e.amount);
    return acc;
  }, {} as Record<string, { date: string; total: number }>);

  return success(res, {
    period: { from, to },
    summary: { expenseCount: expenses.length, total: Number(total.toFixed(2)) },
    byCategory: Object.values(byCategory).sort((a, b) => b.total - a.total),
    byDay: Object.values(byDay).sort((a, b) => a.date.localeCompare(b.date)),
    expenses,
  });
}));

// GET /api/v1/reports/profit
router.get('/profit', asyncHandler(async (req, res) => {
  const { from, to } = parseDateRange(req);
  const businessId = req.user!.businessId!;

  const [payments, expenses] = await Promise.all([
    prisma.payment.aggregate({
      where: { businessId, paymentDate: { gte: from, lte: to } },
      _sum: { amount: true },
    }),
    prisma.expense.aggregate({
      where: { businessId, date: { gte: from, lte: to } },
      _sum: { amount: true },
    }),
  ]);

  const revenue = Number(payments._sum.amount || 0);
  const totalExpenses = Number(expenses._sum.amount || 0);

  // Monthly breakdown
  const paymentsList = await prisma.payment.findMany({
    where: { businessId, paymentDate: { gte: from, lte: to } },
    select: { amount: true, paymentDate: true },
  });
  const expensesList = await prisma.expense.findMany({
    where: { businessId, date: { gte: from, lte: to } },
    select: { amount: true, date: true },
  });

  const byMonth: Record<string, { month: string; revenue: number; expenses: number; profit: number }> = {};
  paymentsList.forEach((p) => {
    const month = p.paymentDate.toISOString().slice(0, 7);
    if (!byMonth[month]) byMonth[month] = { month, revenue: 0, expenses: 0, profit: 0 };
    byMonth[month].revenue += Number(p.amount);
  });
  expensesList.forEach((e) => {
    const month = e.date.toISOString().slice(0, 7);
    if (!byMonth[month]) byMonth[month] = { month, revenue: 0, expenses: 0, profit: 0 };
    byMonth[month].expenses += Number(e.amount);
  });
  Object.values(byMonth).forEach((m) => { m.profit = m.revenue - m.expenses; });

  return success(res, {
    period: { from, to },
    summary: {
      revenue: Number(revenue.toFixed(2)),
      expenses: Number(totalExpenses.toFixed(2)),
      profit: Number((revenue - totalExpenses).toFixed(2)),
    },
    byMonth: Object.values(byMonth).sort((a, b) => a.month.localeCompare(b.month)),
  });
}));

// GET /api/v1/reports/products
router.get('/products', asyncHandler(async (req, res) => {
  const { from, to } = parseDateRange(req);
  const businessId = req.user!.businessId!;

  const items = await prisma.invoiceItem.findMany({
    where: {
      invoice: { businessId, status: { notIn: ['DRAFT', 'CANCELLED'] }, createdAt: { gte: from, lte: to } },
    },
    include: { product: { select: { name: true, type: true, costPrice: true } } },
  });

  const byProduct = items.reduce((acc, item) => {
    const name = item.product?.name || 'Custom';
    if (!acc[name]) acc[name] = { name, type: item.product?.type || 'SERVICE', quantity: 0, revenue: 0, cost: 0 };
    acc[name].quantity += item.quantity;
    acc[name].revenue += Number(item.lineTotal);
    acc[name].cost += item.quantity * Number(item.product?.costPrice || 0);
    return acc;
  }, {} as Record<string, { name: string; type: string; quantity: number; revenue: number; cost: number }>);

  const products = Object.values(byProduct).map((p) => ({
    ...p,
    revenue: Number(p.revenue.toFixed(2)),
    cost: Number(p.cost.toFixed(2)),
    profit: Number((p.revenue - p.cost).toFixed(2)),
  })).sort((a, b) => b.revenue - a.revenue);

  return success(res, { period: { from, to }, products });
}));

// GET /api/v1/reports/customers
router.get('/customers', asyncHandler(async (req, res) => {
  const { from, to } = parseDateRange(req);
  const businessId = req.user!.businessId!;

  const payments = await prisma.payment.findMany({
    where: { businessId, paymentDate: { gte: from, lte: to } },
    include: { customer: { select: { id: true, name: true } } },
  });

  const byCustomer = payments.reduce((acc, p) => {
    const name = p.customer?.name || 'Walk-in';
    if (!acc[name]) acc[name] = { name, customerId: p.customer?.id || null, totalPaid: 0, count: 0 };
    acc[name].totalPaid += Number(p.amount);
    acc[name].count += 1;
    return acc;
  }, {} as Record<string, { name: string; customerId: string | null; totalPaid: number; count: number }>);

  const customers = Object.values(byCustomer).sort((a, b) => b.totalPaid - a.totalPaid);

  return success(res, { period: { from, to }, customers });
}));

export default router;
