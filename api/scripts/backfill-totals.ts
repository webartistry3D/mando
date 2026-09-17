/**
 * Backfill script: recompute stored document totals from line items.
 *
 * Recalculates for every Estimate and Invoice:
 *   subtotal, discount, tax, total
 * And for Invoices also:
 *   amountPaid (from payments), balanceDue = total - amountPaid
 *
 * Line items' discount/tax are stored as currency AMOUNTS.
 *
 * Usage: npx tsx scripts/backfill-totals.ts
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function round2(n: number): number {
  return Number(n.toFixed(2));
}

function calcTotals(items: Array<{ quantity: number; unitPrice: number; discount: number; tax: number }>, deliveryFee = 0) {
  const subtotal = items.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
  const discount = items.reduce((s, i) => s + i.discount, 0);
  const tax = items.reduce((s, i) => s + i.tax, 0);
  const total = subtotal - discount + tax + deliveryFee;
  return {
    subtotal: round2(subtotal),
    discount: round2(discount),
    tax: round2(tax),
    total: round2(total),
  };
}

async function backfillEstimates() {
  const estimates = await prisma.estimate.findMany({ include: { items: true } });
  let updated = 0;
  for (const est of estimates) {
    const t = calcTotals(
      est.items.map((i) => ({
        quantity: i.quantity,
        unitPrice: Number(i.unitPrice),
        discount: Number(i.discount),
        tax: Number(i.tax),
      })),
    );
    const needsUpdate =
      round2(Number(est.subtotal)) !== t.subtotal ||
      round2(Number(est.discount)) !== t.discount ||
      round2(Number(est.tax)) !== t.tax ||
      round2(Number(est.total)) !== t.total;
    if (needsUpdate) {
      await prisma.estimate.update({
        where: { id: est.id },
        data: { subtotal: t.subtotal, discount: t.discount, tax: t.tax, total: t.total },
      });
      updated++;
      console.log(`Estimate ${est.number}: total ${est.total} -> ${t.total}`);
    }
  }
  console.log(`Estimates: ${updated}/${estimates.length} updated`);
}

async function backfillInvoices() {
  const invoices = await prisma.invoice.findMany({ include: { items: true, payments: true, deliveries: { select: { deliveryFee: true } } } });
  let updated = 0;
  let paymentsFixed = 0;
  for (const inv of invoices) {
    const deliveryFee = inv.deliveries.reduce((s, d) => s + Number(d.deliveryFee), 0);
    const t = calcTotals(
      inv.items.map((i) => ({
        quantity: i.quantity,
        unitPrice: Number(i.unitPrice),
        discount: Number(i.discount),
        tax: Number(i.tax),
      })),
      deliveryFee,
    );
    const oldTotal = round2(Number(inv.total));

    // Fix payment amounts that were recorded as the stale full balance.
    // For PAID invoices with a single payment not matching the corrected total,
    // adjust that payment to the corrected total.
    if (
      inv.status === 'PAID' &&
      inv.payments.length === 1 &&
      round2(Number(inv.payments[0].amount)) !== t.total
    ) {
      await prisma.payment.update({
        where: { id: inv.payments[0].id },
        data: { amount: t.total },
      });
      paymentsFixed++;
      console.log(`Payment ${inv.payments[0].id} on ${inv.number}: amount ${inv.payments[0].amount} -> ${t.total}`);
    }

    const amountPaid = round2(
      (await prisma.payment.findMany({ where: { invoiceId: inv.id }, select: { amount: true } }))
        .reduce((s, p) => s + Number(p.amount), 0),
    );
    const balanceDue = round2(Math.max(0, t.total - amountPaid));
    const needsUpdate =
      round2(Number(inv.subtotal)) !== t.subtotal ||
      round2(Number(inv.discount)) !== t.discount ||
      round2(Number(inv.tax)) !== t.tax ||
      round2(Number(inv.total)) !== t.total ||
      round2(Number(inv.amountPaid)) !== amountPaid ||
      round2(Number(inv.balanceDue)) !== balanceDue;
    if (needsUpdate) {
      await prisma.invoice.update({
        where: { id: inv.id },
        data: {
          subtotal: t.subtotal,
          discount: t.discount,
          tax: t.tax,
          total: t.total,
          amountPaid,
          balanceDue,
        },
      });
      updated++;
      console.log(`Invoice ${inv.number}: total ${inv.total} -> ${t.total} (deliveryFee ${deliveryFee}), balanceDue ${inv.balanceDue} -> ${balanceDue}`);
    }
  }
  console.log(`Invoices: ${updated}/${invoices.length} updated, payments fixed: ${paymentsFixed}`);
}

async function main() {
  console.log('Backfilling estimate totals...');
  await backfillEstimates();
  console.log('Backfilling invoice totals...');
  await backfillInvoices();
  console.log('Done.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
