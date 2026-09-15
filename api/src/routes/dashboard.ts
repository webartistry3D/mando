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

// GET /api/v1/dashboard/chart?range=today|7d|30d&from=ISO&to=ISO
router.get('/chart', asyncHandler(async (req, res) => {
  const businessId = req.user!.businessId!;

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  let from: Date;
  let to: Date = now;

  const range = (req.query.range as string) || '7d';
  if (range === 'custom' && req.query.from && req.query.to) {
    from = new Date(req.query.from as string);
    to = new Date(req.query.to as string);
    to.setHours(23, 59, 59, 999);
  } else if (range === 'today') {
    from = todayStart;
  } else if (range === '30d') {
    from = new Date(todayStart);
    from.setDate(from.getDate() - 29);
  } else {
    from = new Date(todayStart);
    from.setDate(from.getDate() - 6);
  }

  const [payments, expenses] = await Promise.all([
    prisma.payment.findMany({
      where: { businessId, paymentDate: { gte: from, lte: to } },
      select: { amount: true, paymentDate: true },
    }),
    prisma.expense.findMany({
      where: { businessId, date: { gte: from, lte: to } },
      select: { amount: true, date: true },
    }),
  ]);

  // Bucket by calendar day
  const days: { date: string; revenue: number; expenses: number }[] = [];
  const cursor = new Date(from);
  cursor.setHours(0, 0, 0, 0);
  const end = new Date(to);
  end.setHours(0, 0, 0, 0);
  while (cursor <= end) {
    days.push({ date: cursor.toISOString().slice(0, 10), revenue: 0, expenses: 0 });
    cursor.setDate(cursor.getDate() + 1);
  }
  const index = new Map(days.map((d, i) => [d.date, i]));

  for (const p of payments) {
    const key = new Date(p.paymentDate).toISOString().slice(0, 10);
    const i = index.get(key);
    if (i !== undefined) days[i].revenue += Number(p.amount);
  }
  for (const e of expenses) {
    const key = new Date(e.date).toISOString().slice(0, 10);
    const i = index.get(key);
    if (i !== undefined) days[i].expenses += Number(e.amount);
  }

  return success(res, { range, from, to, days });
}));

// GET /api/v1/dashboard/outstanding
router.get('/outstanding', asyncHandler(async (req, res) => {
  const businessId = req.user!.businessId!;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const invoices = await prisma.invoice.findMany({
    where: { businessId, status: { in: ['ISSUED', 'PARTIALLY_PAID', 'OVERDUE'] } },
    orderBy: { dueDate: 'asc' },
    take: 10,
    include: { customer: { select: { name: true } } },
  });

  const items = invoices.map((i) => {
    const due = i.dueDate ? new Date(i.dueDate) : null;
    const daysOverdue = due && due < today
      ? Math.floor((today.getTime() - due.getTime()) / 86400000)
      : 0;
    return {
      id: i.id,
      number: i.number,
      customer: i.customer?.name || 'Walk-in',
      total: Number(i.total),
      balanceDue: Number(i.balanceDue),
      status: i.status,
      dueDate: i.dueDate,
      daysOverdue,
    };
  });

  const totalDue = items.reduce((s, i) => s + i.balanceDue, 0);
  const overdueCount = items.filter((i) => i.daysOverdue > 0 || i.status === 'OVERDUE').length;

  return success(res, { invoices: items, totalDue, overdueCount });
}));

// GET /api/v1/dashboard/operations
router.get('/operations', asyncHandler(async (req, res) => {
  const businessId = req.user!.businessId!;

  const [pendingEstimates, activeDeliveries, trackedProducts, recentPayments] = await Promise.all([
    prisma.estimate.count({
      where: { businessId, status: { in: ['DRAFT', 'SENT'] } },
    }),
    prisma.delivery.findMany({
      where: { businessId, status: { in: ['PENDING', 'PROCESSING', 'OUT_FOR_DELIVERY'] } },
      orderBy: { updatedAt: 'desc' },
      take: 5,
      include: { customer: { select: { name: true } } },
    }),
    prisma.product.findMany({
      where: { businessId, isActive: true, inventoryTracking: true, lowStockThreshold: { gt: 0 } },
      include: { inventoryTxns: { select: { type: true, quantity: true } } },
    }),
    prisma.payment.findMany({
      where: { businessId },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: { customer: { select: { name: true } }, invoice: { select: { number: true } } },
    }),
  ]);

  const lowStock = trackedProducts
    .map((p) => {
      const stock = p.inventoryTxns.reduce((sum, t) => {
        if (t.type === 'STOCK_IN') return sum + t.quantity;
        if (t.type === 'STOCK_OUT') return sum - t.quantity;
        return sum + t.quantity; // ADJUSTMENT
      }, p.openingStock);
      return { id: p.id, name: p.name, sku: p.sku, stock, threshold: p.lowStockThreshold };
    })
    .filter((p) => p.stock <= p.threshold)
    .slice(0, 5);

  return success(res, {
    pendingEstimates,
    activeDeliveries: activeDeliveries.map((d) => ({
      id: d.id, number: d.number, customer: d.customer?.name || 'Walk-in', status: d.status,
    })),
    lowStock,
    recentPayments: recentPayments.map((p) => ({
      id: p.id,
      amount: Number(p.amount),
      customer: p.customer?.name || 'Walk-in',
      invoice: p.invoice?.number || null,
      method: p.paymentMethod,
      date: p.paymentDate,
    })),
  });
}));

// GET /api/v1/dashboard/insights
router.get('/insights', asyncHandler(async (req, res) => {
  const businessId = req.user!.businessId!;
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthEnd = new Date(monthStart.getTime() - 1);

  const [overdue, lowStockProducts, pendingEstimates, activeDeliveries, thisMonthExp, lastMonthExp, todayPayments] = await Promise.all([
    prisma.invoice.findMany({
      where: { businessId, status: 'OVERDUE' },
      select: { number: true, balanceDue: true },
      take: 5,
    }),
    prisma.product.findMany({
      where: { businessId, isActive: true, inventoryTracking: true, lowStockThreshold: { gt: 0 } },
      include: { inventoryTxns: { select: { type: true, quantity: true } } },
    }),
    prisma.estimate.count({ where: { businessId, status: 'SENT' } }),
    prisma.delivery.count({ where: { businessId, status: { in: ['PENDING', 'PROCESSING', 'OUT_FOR_DELIVERY'] } } }),
    prisma.expense.aggregate({ where: { businessId, date: { gte: monthStart } }, _sum: { amount: true } }),
    prisma.expense.aggregate({ where: { businessId, date: { gte: lastMonthStart, lte: lastMonthEnd } }, _sum: { amount: true } }),
    prisma.payment.aggregate({ where: { businessId, paymentDate: { gte: today } }, _sum: { amount: true }, _count: true }),
  ]);

  const insights: { icon: string; text: string; link?: string; severity: 'info' | 'warning' | 'success' }[] = [];

  if (overdue.length > 0) {
    const total = overdue.reduce((s, i) => s + Number(i.balanceDue), 0);
    insights.push({
      icon: 'alert',
      text: `${overdue.length} invoice${overdue.length > 1 ? 's are' : ' is'} overdue — ₦${total.toLocaleString()} outstanding (${overdue.map((i) => i.number).slice(0, 3).join(', ')})`,
      link: '/invoices?status=OVERDUE',
      severity: 'warning',
    });
  }

  const low = lowStockProducts
    .map((p) => ({
      name: p.name,
      stock: p.inventoryTxns.reduce((s, t) => s + (t.type === 'STOCK_OUT' ? -t.quantity : t.quantity), p.openingStock),
      threshold: p.lowStockThreshold,
    }))
    .filter((p) => p.stock <= p.threshold);
  if (low.length > 0) {
    insights.push({
      icon: 'package',
      text: `${low.length} product${low.length > 1 ? 's are' : ' is'} low in stock (${low.map((p) => p.name).slice(0, 3).join(', ')})`,
      link: '/products',
      severity: 'warning',
    });
  }

  if (pendingEstimates > 0) {
    insights.push({
      icon: 'file',
      text: `${pendingEstimates} estimate${pendingEstimates > 1 ? 's' : ''} awaiting customer response — consider following up`,
      link: '/estimates',
      severity: 'info',
    });
  }

  if (activeDeliveries > 0) {
    insights.push({
      icon: 'truck',
      text: `${activeDeliveries} deliver${activeDeliveries > 1 ? 'ies' : 'y'} in progress`,
      link: '/deliveries',
      severity: 'info',
    });
  }

  const thisMonth = Number(thisMonthExp._sum.amount || 0);
  const lastMonth = Number(lastMonthExp._sum.amount || 0);
  if (lastMonth > 0 && thisMonth > lastMonth) {
    insights.push({
      icon: 'trending',
      text: `You spent ₦${(thisMonth - lastMonth).toLocaleString()} more this month than last month`,
      link: '/reports?tab=expenses',
      severity: 'info',
    });
  } else if (lastMonth > 0 && thisMonth < lastMonth) {
    insights.push({
      icon: 'trending',
      text: `Expenses are down ₦${(lastMonth - thisMonth).toLocaleString()} vs last month`,
      link: '/reports?tab=expenses',
      severity: 'success',
    });
  }

  const todayTotal = Number(todayPayments._sum.amount || 0);
  if (todayTotal > 0) {
    insights.push({
      icon: 'cash',
      text: `₦${todayTotal.toLocaleString()} collected today across ${todayPayments._count} payment${todayPayments._count > 1 ? 's' : ''}`,
      link: '/payments',
      severity: 'success',
    });
  }

  if (insights.length === 0) {
    insights.push({
      icon: 'check',
      text: 'All clear — no overdue invoices, low stock, or pending items right now.',
      severity: 'success',
    });
  }

  return success(res, insights);
}));

export default router;
