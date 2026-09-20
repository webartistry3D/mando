import jsPDF from 'jspdf';
import { formatDate } from './utils';
import type { Estimate, Invoice } from '@/types';

function formatCurrencyPDF(amount: number): string {
  const value = typeof amount === 'number' ? amount : Number(amount);
  return `NGN ${value.toLocaleString('en-US', { useGrouping: true, minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

type Business = { name: string; address?: string | null; phone?: string | null; email?: string | null };

function drawInfoBlock(
  doc: jsPDF,
  title: string,
  number: string,
  date: string,
  extraLabel: string | null,
  extraValue: string | null
) {
  const rightX = 190;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(24);
  doc.text(title, rightX, 25, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  const info = [
    ['No.', number],
    ['Date', date],
  ];
  if (extraValue && extraLabel) info.push([extraLabel, extraValue]);

  info.forEach(([label, value], i) => {
    const y = 40 + i * 8;
    doc.setFont('helvetica', 'bold');
    doc.text(`${label}:`, rightX - 55, y);
    doc.setFont('helvetica', 'normal');
    doc.text(value ?? '', rightX, y, { align: 'right' });
  });
}

function drawBusinessHeader(doc: jsPDF, business: Business) {
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text(business.name, 20, 25);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  let y = 33;
  if (business.address) {
    doc.text(business.address, 20, y);
    y += 6;
  }
  if (business.phone) {
    doc.text(business.phone, 20, y);
    y += 6;
  }
  if (business.email) {
    doc.text(business.email, 20, y);
    y += 6;
  }
  return y;
}

function drawCustomerBlock(doc: jsPDF, customer: { name: string; address?: string | null; phone?: string | null; email?: string | null } | undefined | null, startY: number) {
  const boxY = startY;
  const lineH = 6;
  const detailLines = [customer?.address, customer?.phone, customer?.email].filter(Boolean).length;
  const boxH = 20 + detailLines * lineH;

  doc.setFillColor(245, 245, 245);
  doc.rect(15, boxY, 95, boxH, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('BILL TO', 20, boxY + 9);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.text(customer?.name || '-', 20, boxY + 18);

  let y = boxY + 26;
  doc.setFontSize(10);
  if (customer?.address) {
    doc.text(customer.address, 20, y);
    y += lineH;
  }
  if (customer?.phone) {
    doc.text(customer.phone, 20, y);
    y += lineH;
  }
  if (customer?.email) {
    doc.text(customer.email, 20, y);
    y += lineH;
  }

  return boxY + boxH + 10;
}

function drawItemsTable(doc: jsPDF, items: Array<{ description: string; quantity: number; unitPrice: number; discount: number; tax: number; lineTotal?: number }>, startY: number): number {
  const rightEdges = [125, 160, 195];
  const headers = ['Qty', 'Unit Price', 'Total'];
  const rowH = 10;
  let y = startY;

  // Header background
  doc.setFillColor(235, 235, 235);
  doc.rect(15, y - 6, 180, 13, 'F');

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Description', 20, y);
  headers.forEach((h, i) => doc.text(h, rightEdges[i], y, { align: 'right' }));

  y += 14;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);

  items.forEach((item) => {
    const total = item.lineTotal ?? item.quantity * item.unitPrice - item.discount + item.tax;
    doc.text(item.description.substring(0, 34), 20, y);
    doc.text(String(item.quantity), rightEdges[0], y, { align: 'right' });
    doc.text(formatCurrencyPDF(item.unitPrice), rightEdges[1], y, { align: 'right' });
    doc.text(formatCurrencyPDF(total), rightEdges[2], y, { align: 'right' });
    y += rowH;
  });

  // Bottom rule
  doc.setDrawColor(180, 180, 180);
  doc.setLineWidth(0.4);
  doc.line(15, y - 2, 195, y - 2);

  return y;
}

function drawTotals(doc: jsPDF, items: Array<{ quantity: number; unitPrice: number; discount: number; tax: number; lineTotal?: number }>, startY: number, deliveryFee = 0): number {
  const boxX = 120;
  const boxW = 80;
  const rowH = 7;
  const subtotal = items.reduce((sum, i) => sum + Number(i.quantity) * Number(i.unitPrice), 0);
  const discount = items.reduce((sum, i) => sum + Number(i.discount), 0);
  const tax = items.reduce((sum, i) => sum + Number(i.tax), 0);
  const total = subtotal - discount + tax + deliveryFee;
  const rows: Array<[string, number]> = [
    ['Subtotal', subtotal],
    ['Discount', -discount],
    ['Tax', tax],
  ];
  if (deliveryFee > 0) rows.push(['Delivery Fee', deliveryFee]);
  rows.push(['Total', total]);

  const boxH = rows.length * rowH + 12;
  const boxY = startY;
  doc.setFillColor(245, 245, 245);
  doc.rect(boxX, boxY, boxW, boxH, 'F');

  let y = boxY + 11;
  doc.setFontSize(11);
  rows.forEach(([label, value], i) => {
    const isTotal = i === rows.length - 1;
    doc.setFont('helvetica', isTotal ? 'bold' : 'normal');
    doc.text(label, boxX + 10, y);

    const sign = value < 0 ? '-' : value > 0 && (label === 'Tax' || label === 'Discount') ? '+' : '';
    const amount = `${sign}${formatCurrencyPDF(Math.abs(value))}`;
    doc.text(amount, boxX + boxW - 10, y, { align: 'right' });
    y += rowH;
  });

  return boxY + boxH + 10;
}

function drawNotes(doc: jsPDF, notes: string | null | undefined, terms: string | null | undefined, startY: number): number {
  let y = startY;
  if (notes) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('Notes', 20, y);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    const lines = doc.splitTextToSize(notes, 170);
    doc.text(lines, 20, y + 6);
    y += 12 + lines.length * 5;
  }
  if (terms) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('Terms', 20, y);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    const lines = doc.splitTextToSize(terms, 170);
    doc.text(lines, 20, y + 6);
    y += 12 + lines.length * 5;
  }
  return y;
}

function buildEstimateDoc(estimate: Estimate, business: Business) {
  const doc = new jsPDF();

  drawBusinessHeader(doc, business);
  drawInfoBlock(
    doc,
    'ESTIMATE',
    estimate.number,
    formatDate(estimate.issueDate),
    estimate.expiryDate ? 'Expires' : null,
    estimate.expiryDate ? formatDate(estimate.expiryDate) : null
  );

  let y = drawCustomerBlock(doc, estimate.customer as any, 72);
  y = drawItemsTable(doc, estimate.items || [], y);
  y = drawTotals(doc, estimate.items || [], y, Number(estimate.deliveryFee) || 0);
  y = drawNotes(doc, estimate.notes, estimate.terms, y);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text('Thank you for your business.', 105, 285, { align: 'center' });
  doc.setTextColor(0, 0, 0);

  return doc;
}

export function generateEstimatePDFBlob(estimate: Estimate, business: Business): Blob {
  return buildEstimateDoc(estimate, business).output('blob');
}

export function generateEstimatePDF(estimate: Estimate, business: Business) {
  buildEstimateDoc(estimate, business).save(`${estimate.number}.pdf`);
}

function buildInvoiceDoc(invoice: Invoice, business: Business) {
  const doc = new jsPDF();

  drawBusinessHeader(doc, business);
  drawInfoBlock(
    doc,
    'INVOICE',
    invoice.number,
    formatDate(invoice.issueDate),
    invoice.dueDate ? 'Due' : null,
    invoice.dueDate ? formatDate(invoice.dueDate) : null
  );

  let y = drawCustomerBlock(doc, invoice.customer as any, 72);
  y = drawItemsTable(doc, invoice.items || [], y);
  const deliveryFee = Number(invoice.deliveryFee) || 0;
  y = drawTotals(doc, invoice.items || [], y, deliveryFee);

  // Payment summary
  y += 8;
  doc.setFillColor(235, 235, 235);
  doc.rect(15, y - 6, 95, 42, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('PAYMENT SUMMARY', 20, y + 2);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`Total: ${formatCurrencyPDF(invoice.total)}`, 20, y + 14);
  doc.text(`Paid: ${formatCurrencyPDF(invoice.amountPaid)}`, 20, y + 24);
  doc.text(`Balance: ${formatCurrencyPDF(invoice.balanceDue)}`, 20, y + 34);
  y += 46;

  y = drawNotes(doc, invoice.notes, null, y);

  if (invoice.paymentInstructions) {
    y += 8;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('Payment Instructions', 20, y);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    const lines = doc.splitTextToSize(invoice.paymentInstructions, 170);
    doc.text(lines, 20, y + 6);
    y += 12 + lines.length * 5;
  }

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text('Thank you for your business.', 105, 285, { align: 'center' });
  doc.setTextColor(0, 0, 0);

  return doc;
}

export function generateInvoicePDFBlob(invoice: Invoice, business: Business): Blob {
  return buildInvoiceDoc(invoice, business).output('blob');
}

export function generateInvoicePDF(invoice: Invoice, business: Business) {
  buildInvoiceDoc(invoice, business).save(`${invoice.number}.pdf`);
}
