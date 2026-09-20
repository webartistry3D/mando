import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../index.js';
import { calcEstimateInvoiceTotals } from '../routes/estimates.js';

describe('Health check', () => {
  it('GET /health returns 200', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('GET /api/v1/health returns 200', async () => {
    const res = await request(app).get('/api/v1/health');
    expect(res.status).toBe(200);
  });
});

describe('Auth', () => {
  it('POST /api/v1/auth/register requires fields', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({});
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});

describe('Protected routes', () => {
  it('GET /api/v1/customers without token returns 401', async () => {
    const res = await request(app).get('/api/v1/customers');
    expect(res.status).toBe(401);
  });

  it('GET /api/v1/products without token returns 401', async () => {
    const res = await request(app).get('/api/v1/products');
    expect(res.status).toBe(401);
  });

  it('GET /api/v1/invoices without token returns 401', async () => {
    const res = await request(app).get('/api/v1/invoices');
    expect(res.status).toBe(401);
  });
});

describe('Estimate conversion totals', () => {
  it('includes the estimate delivery fee in the converted invoice total', () => {
    const totals = calcEstimateInvoiceTotals({
      items: [
        { quantity: 2, unitPrice: 50, discount: 5, tax: 10 },
        { quantity: 1, unitPrice: 20, discount: 0, tax: 0 },
      ],
      deliveryFee: 25,
    });

    expect(totals.subtotal).toBe(120);
    expect(totals.discount).toBe(5);
    expect(totals.tax).toBe(10);
    expect(totals.total).toBe(150);
  });
});
