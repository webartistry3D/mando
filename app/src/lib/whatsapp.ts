import type { Estimate, Invoice } from '@/types';

function formatMoney(value: number): string {
  return `₦${Number(value || 0).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

//function formatItemRows(items: Array<{ description: string; quantity: number; unitPrice: number; discount: number; tax: number; lineTotal?: number }>) {
function formatItemRows(items: Array<{ description: string; quantity: number; unitPrice: number; discount: number; tax: number; lineTotal?: number }>) {
  if (!items?.length) return 'Items: None';

  return items
    .map((item) => {
      //const subtotal = Number(item.quantity) * Number(item.unitPrice);
      //const lineDiscount = Number(item.discount || 0);
      //const lineTax = Number(item.tax || 0);
      //const lineTotal = Number(item.lineTotal ?? subtotal - lineDiscount + lineTax);
      return `- ${item.description} x${item.quantity}`;
    })
    .join('\n');
}

export function buildEstimateWhatsAppMessage(estimate: Estimate, pdfUrl: string) {
  const subtotal = Number(estimate.subtotal ?? estimate.items?.reduce((sum, item) => sum + Number(item.quantity) * Number(item.unitPrice), 0) ?? 0);
  const discount = Number(estimate.discount ?? estimate.items?.reduce((sum, item) => sum + Number(item.discount), 0) ?? 0);
  const tax = Number(estimate.tax ?? estimate.items?.reduce((sum, item) => sum + Number(item.tax), 0) ?? 0);
  const deliveryFee = Number(estimate.deliveryFee || 0);
  const total = Number(estimate.total ?? subtotal - discount + tax + deliveryFee);

  return [
    `Estimate ${estimate.number}`,
    `Customer: ${estimate.customer?.name || 'Walk-in'}`,
    `Expiry: ${estimate.expiryDate ? new Date(estimate.expiryDate).toLocaleDateString() : 'N/A'}`,
    '',
    'Items:',
    formatItemRows(estimate.items || []),
    '',
    `Subtotal: ${formatMoney(subtotal)}`,
    `Discount: ${formatMoney(discount)}`,
    `Tax: ${formatMoney(tax)}`,
    `Delivery Cost: ${formatMoney(deliveryFee)}`,
    `Total: ${formatMoney(total)}`,
    '',
    'PDF: ' + pdfUrl,
  ].join('\n');
}

export function buildInvoiceWhatsAppMessage(invoice: Invoice, pdfUrl: string) {
  const grossSubtotal = invoice.items?.reduce((sum, item) => sum + Number(item.quantity) * Number(item.unitPrice), 0) || 0;
  const subtotal = Number(invoice.subtotal ?? grossSubtotal);
  const discount = Number(invoice.discount ?? invoice.items?.reduce((sum, item) => sum + Number(item.discount), 0) ?? 0);
  const tax = Number(invoice.tax ?? invoice.items?.reduce((sum, item) => sum + Number(item.tax), 0) ?? 0);
  const deliveryFee = Number(invoice.deliveryFee) || 0;
  const total = Number(invoice.total ?? subtotal - discount + tax + deliveryFee);
  const balanceDue = Number(invoice.balanceDue ?? Math.max(0, total - Number(invoice.amountPaid || 0)));

  return [
    `Invoice ${invoice.number}`,
    `Customer: ${invoice.customer?.name || 'Walk-in'}`,
    `Due: ${invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : 'N/A'}`,
    '',
    'Items:',
    formatItemRows(invoice.items || []),
    '',
    `Subtotal: ${formatMoney(subtotal)}`,
    `Discount: ${formatMoney(discount)}`,
    `Tax: ${formatMoney(tax)}`,
    `Delivery Cost: ${formatMoney(deliveryFee)}`,
    `Total: ${formatMoney(total)}`,
    `Balance Due: ${formatMoney(balanceDue)}`,
    '',
    'PDF: ' + pdfUrl,
  ].join('\n');
}
