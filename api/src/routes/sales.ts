import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { authRequired, loadBusinessContext } from '../middleware/auth.js';
import { success, asyncHandler } from '../lib/response.js';

const router = Router();

router.use(authRequired, loadBusinessContext);

// GET /api/v1/sales/overview
router.get('/overview', asyncHandler(async (req, res) => {
  const businessId = req.user!.businessId!;

  const [estimates, invoices, payments] = await Promise.all([
    prisma.estimate.findMany({
      where: { businessId },
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: { customer: { select: { name: true } } },
    }),
    prisma.invoice.findMany({
      where: { businessId, status: { notIn: ['DRAFT', 'CANCELLED'] } },
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: { customer: { select: { name: true } } },
    }),
    prisma.payment.findMany({
      where: { businessId },
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: { customer: { select: { name: true } }, invoice: { select: { number: true } } },
    }),
  ]);

  const outstanding = await prisma.invoice.aggregate({
    where: { businessId, status: { in: ['ISSUED', 'PARTIALLY_PAID', 'OVERDUE'] } },
    _sum: { balanceDue: true },
    _count: true,
  });

  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const monthRevenue = await prisma.payment.aggregate({
    where: { businessId, paymentDate: { gte: monthStart } },
    _sum: { amount: true },
  });

  const monthExpenses = await prisma.expense.aggregate({
    where: { businessId, date: { gte: monthStart } },
    _sum: { amount: true },
  });

  return success(res, {
    recentEstimates: estimates,
    recentInvoices: invoices,
    recentPayments: payments,
    outstandingInvoices: {
      count: outstanding._count,
      total: Number(outstanding._sum.balanceDue || 0),
    },
    summary: {
      monthRevenue: Number(monthRevenue._sum.amount || 0),
      monthExpenses: Number(monthExpenses._sum.amount || 0),
      monthProfit: Number(monthRevenue._sum.amount || 0) - Number(monthExpenses._sum.amount || 0),
    },
  });
}));

export default router;
