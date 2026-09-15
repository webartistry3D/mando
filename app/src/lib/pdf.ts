import jsPDF from 'jspdf';
import { formatCurrency, formatDate } from './utils';
import type { Estimate, Invoice } from '@/types';

function drawHeader(doc: jsPDF, business: { name: string; address?: string | null; phone?: string | null; email?: string | null }, title: string) {
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text(title, 20, 25);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(business.name, 20, 35);
  if (business.address) doc.text(business.address, 20, 41);
  if (business.phone) doc.text(business.phone, 20, 47);
  if (business.email) doc.text(business.email, 20, 53);
}

function drawItemsTable(doc: jsPDF, items: Array<{ description: string; quantity: number; unitPrice: number; discount: number; tax: number; lineTotal?: number }>, startY: number): number {
  const colX = [20, 60, 85, 110, 135, 160];
  const headers = ['Description', 'Qty', 'Unit Price', 'Discount', 'Tax', 'Total'];
  let y = startY;

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  headers.forEach((h, i) => doc.text(h, colX[i], y));
  y += 6;
  doc.setLineWidth(0.2);
  doc.line(20, y, 190, y);
  y += 6;

  doc.setFont('helvetica', 'normal');
  items.forEach((item) => {
    const total = item.lineTotal ?? item.quantity * item.unitPrice - item.discount + item.tax;
    doc.text(item.description.substring(0, 30), colX[0], y);
    doc.text(String(item.quantity), colX[1], y);
    doc.text(formatCurrency(item.unitPrice), colX[2], y);
    doc.text(formatCurrency(item.discount), colX[3], y);
    doc.text(formatCurrency(item.tax), colX[4], y);
    doc.text(formatCurrency(total), colX[5], y);
    y += 6;
  });

  return y;
}

function drawTotals(doc: jsPDF, subtotal: number, discount: number, tax: number, total: number, startY: number) {
  let y = startY + 6;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);

  doc.text('Subtotal:', 140, y);
  doc.text(formatCurrency(subtotal), 190, y, { align: 'right' });
  y += 5;
  if (discount > 0) {
    doc.text('Discount:', 140, y);
    doc.text(`-${formatCurrency(discount)}`, 190, y, { align: 'right' });
    y += 5;
  }
  if (tax > 0) {
    doc.text('Tax:', 140, y);
    doc.text(`+${formatCurrency(tax)}`, 190, y, { align: 'right' });
    y += 5;
  }
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('Total:', 140, y);
  doc.text(formatCurrency(total), 190, y, { align: 'right' });
}

export function generateEstimatePDF(estimate: Estimate, business: { name: string; address?: string | null; phone?: string | null; email?: string | null }) {
  const doc = new jsPDF();
  drawHeader(doc, business, 'Estimate');

  doc.setFontSize(10);
  doc.text(`Estimate #: ${estimate.number}`, 140, 25);
  doc.text(`Date: ${formatDate(estimate.issueDate)}`, 140, 31);
  if (estimate.expiryDate) doc.text(`Expires: ${formatDate(estimate.expiryDate)}`, 140, 37);
  doc.text(`Customer: ${estimate.customer?.name || '—'}`, 140, 43);

  let y = drawItemsTable(doc, estimate.items || [], 60);
  drawTotals(doc, estimate.subtotal, estimate.discount, estimate.tax, estimate.total, y);

  if (estimate.notes) {
    y += 12;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('Notes:', 20, y);
    doc.setFont('helvetica', 'normal');
    doc.text(estimate.notes, 20, y + 5, { maxWidth: 170 });
    y += 5 + Math.ceil(estimate.notes.length / 80) * 5;
  }
  if (estimate.terms) {
    doc.setFont('helvetica', 'bold');
    doc.text('Terms:', 20, y);
    doc.setFont('helvetica', 'normal');
    doc.text(estimate.terms, 20, y + 5, { maxWidth: 170 });
  }

  doc.save(`${estimate.number}.pdf`);
}

export function generateInvoicePDF(invoice: Invoice, business: { name: string; address?: string | null; phone?: string | null; email?: string | null }) {
  const doc = new jsPDF();
  drawHeader(doc, business, 'Invoice');

  doc.setFontSize(10);
  doc.text(`Invoice #: ${invoice.number}`, 140, 25);
  doc.text(`Date: ${formatDate(invoice.issueDate)}`, 140, 31);
  if (invoice.dueDate) doc.text(`Due: ${formatDate(invoice.dueDate)}`, 140, 37);
  doc.text(`Customer: ${invoice.customer?.name || 'Walk-in'}`, 140, 43);
  doc.text(`Status: ${invoice.status.replace('_', ' ')}`, 140, 49);

  let y = drawItemsTable(doc, invoice.items || [], 60);
  drawTotals(doc, invoice.subtotal, invoice.discount, invoice.tax, invoice.total, y);

  y += 12;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('Payment Summary:', 20, y);
  doc.setFont('helvetica', 'normal');
  doc.text(`Total: ${formatCurrency(invoice.total)}`, 20, y + 6);
  doc.text(`Paid: ${formatCurrency(invoice.amountPaid)}`, 20, y + 12);
  doc.text(`Balance: ${formatCurrency(invoice.balanceDue)}`, 20, y + 18);
  y += 24;

  if (invoice.paymentInstructions) {
    doc.setFont('helvetica', 'bold');
    doc.text('Payment Instructions:', 20, y);
    doc.setFont('helvetica', 'normal');
    doc.text(invoice.paymentInstructions, 20, y + 5, { maxWidth: 170 });
  }

  doc.save(`${invoice.number}.pdf`);
}
