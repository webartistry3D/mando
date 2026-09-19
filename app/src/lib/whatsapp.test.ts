import { describe, expect, it } from 'vitest';
import { buildEstimateWhatsAppMessage, buildInvoiceWhatsAppMessage } from './whatsapp';

describe('WhatsApp message builders', () => {
  it('includes item rows, totals, and PDF link for estimates', () => {
    const message = buildEstimateWhatsAppMessage({
      id: 'est-1',
      businessId: 'biz-1',
      customerId: 'cus-1',
      number: 'EST-0001',
      status: 'SENT',
      issueDate: '2026-09-18',
      expiryDate: '2026-09-30',
      subtotal: 5000,
      discount: 200,
      tax: 250,
      deliveryFee: 300,
      total: 5350,
      customer: { businessId: 'biz-1', id: 'cus-1', name: 'Jane Doe', phone: '+2348012345678', email: 'jane@example.com', address: 'Lagos', isActive: true, createdAt: '2026-09-01', updatedAt: '2026-09-01' },
      items: [
        { description: 'Laptop', quantity: 1, unitPrice: 4500, discount: 0, tax: 200 },
        { description: 'Mouse', quantity: 2, unitPrice: 250, discount: 200, tax: 50 },
      ],
      createdAt: '2026-09-18',
      updatedAt: '2026-09-18',
    }, 'https://example.com/estimate.pdf');

    expect(message).toContain('Laptop');
    expect(message).toContain('x1');
    expect(message).toContain('Subtotal:');
    expect(message).toContain('Discount:');
    expect(message).toContain('Tax:');
    expect(message).toContain('Delivery Cost:');
    expect(message).toContain('https://example.com/estimate.pdf');
  });

  it('includes item rows, totals, and PDF link for invoices', () => {
    const message = buildInvoiceWhatsAppMessage({
      id: 'inv-1',
      businessId: 'biz-1',
      customerId: 'cus-1',
      number: 'INV-0001',
      status: 'ISSUED',
      issueDate: '2026-09-18',
      dueDate: '2026-09-30',
      subtotal: 5000,
      discount: 200,
      tax: 250,
      total: 5350,
      amountPaid: 2000,
      balanceDue: 3350,
      customer: { businessId: 'biz-1', id: 'cus-1', name: 'Jane Doe', phone: '+2348012345678', email: 'jane@example.com', address: 'Lagos', isActive: true, createdAt: '2026-09-01', updatedAt: '2026-09-01' },
      items: [
        { description: 'Laptop', quantity: 1, unitPrice: 4500, discount: 0, tax: 200 },
        { description: 'Mouse', quantity: 2, unitPrice: 250, discount: 200, tax: 50 },
      ],
      payments: [],
      deliveries: [{
        id: 'del-1',
        businessId: 'biz-1',
        customerId: 'cus-1',
        number: 'DEL-0001',
        deliveryFee: 300,
        status: 'PENDING',
        createdAt: '2026-09-18',
        updatedAt: '2026-09-18',
      }],
      createdAt: '2026-09-18',
      updatedAt: '2026-09-18',
    }, 'https://example.com/invoice.pdf');

    expect(message).toContain('Laptop');
    expect(message).toContain('x1');
    expect(message).toContain('Subtotal:');
    expect(message).toContain('Discount:');
    expect(message).toContain('Tax:');
    expect(message).toContain('Delivery Cost:');
    expect(message).toContain('Balance Due:');
    expect(message).toContain('https://example.com/invoice.pdf');
  });
});
