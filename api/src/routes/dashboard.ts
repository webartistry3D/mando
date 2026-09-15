import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { authRequired, loadBusinessContext } from '../middleware/auth.js';
import { success, asyncHandler } from '../lib/response.js';

const router = Router();

router.use(authRequired, loadBusinessContext);

// GET /api/v1/dashboard/summary
router.get('/summary', asyncHandler(async (req, res) => {
  const businessId = req.user!.businessId!;

  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [revenue, expenses, pendingInvoices, pendingDeliveries, overdueCount] = await Promise.all([
    prisma.payment.aggregate({
      where: { businessId, paymentDate: { gte: monthStart } },
      _sum: { amount: true },
      _count: true,
    }),
    prisma.expense.aggregate({
      where: { businessId, date: { gte: monthStart } },
      _sum: { amount: true },
      _count: true,
    }),
    prisma.invoice.aggregate({
      where: { businessId, status: { in: ['ISSUED', 'PARTIALLY_PAID', 'OVERDUE'] } },
      _sum: { balanceDue: true },
      _count: true,
    }),
    prisma.delivery.aggregate({
      where: { businessId, status: { in: ['PENDING', 'PROCESSING', 'OUT_FOR_DELIVERY'] } },
      _count: true,
    }),
    prisma.invoice.count({
      where: { businessId, status: 'OVERDUE' },
    }),
  ]);

  const monthRevenue = Number(revenue._sum.amount || 0);
  const monthExpenses = Number(expenses._sum.amount || 0);

  return success(res, {
    revenue: { amount: monthRevenue, count: revenue._count },
    expenses: { amount: monthExpenses, count: expenses._count },
    profit: monthRevenue - monthExpenses,
    outstanding: { amount: Number(pendingInvoices._sum.balanceDue || 0), count: pendingInvoices._count },
    overdueCount,
    pendingDeliveries: pendingDeliveries._count,
  });
}));

// GET /api/v1/dashboard/activity
router.get('/activity', asyncHandler(async (req, res) => {
  const businessId = req.user!.businessId!;

  const [invoices, payments, deliveries, expenses] = await Promise.all([
    prisma.invoice.findMany({
      where: { businessId },
      orderBy: { updatedAt: 'desc' },
      take: 5,
      include: { customer: { select: { name: true } } },
    }),
    prisma.payment.findMany({
      where: { businessId },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: { customer: { select: { name: true } }, invoice: { select: { number: true } } },
    }),
    prisma.delivery.findMany({
      where: { businessId },
      orderBy: { updatedAt: 'desc' },
      take: 5,
      include: { customer: { select: { name: true } } },
    }),
    prisma.expense.findMany({
      where: { businessId },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: { category: { select: { name: true } } },
    }),
  ]);

  // Combine and sort by date
  const activities = [
    ...invoices.map((i) => ({ type: 'invoice' as const, date: i.updatedAt, label: `${i.number} — ${i.customer?.name || 'Walk-in'}`, detail: `${i.status.replace('_', ' ')} · ₦${Number(i.total).toLocaleString()}`, link: `/invoices/${i.id}` })),
    ...payments.map((p) => ({ type: 'payment' as const, date: p.createdAt, label: `Payment ${p.invoice?.number ? `for ${p.invoice.number}` : ''}`, detail: `₦${Number(p.amount).toLocaleString()} via ${p.paymentMethod.replace('_', ' ')}`, link: `/payments/${p.id}` })),
    ...deliveries.map((d) => ({ type: 'delivery' as const, date: d.updatedAt, label: `${d.number} — ${d.customer?.name || 'Walk-in'}`, detail: d.status.replace('_', ' '), link: `/deliveries/${d.id}` })),
    ...expenses.map((e) => ({ type: 'expense' as const, date: e.createdAt, label: `${e.description}`, detail: `${e.category.name} · ₦${Number(e.amount).toLocaleString()}`, link: `/expenses` })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 15);

  return success(res, activities);
}));

export default router;
