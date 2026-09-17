import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import authRoutes from './routes/auth.js';
import businessRoutes from './routes/business.js';
import customerRoutes from './routes/customers.js';
import productRoutes from './routes/products.js';
import inventoryRoutes from './routes/inventory.js';
import estimateRoutes from './routes/estimates.js';
import invoiceRoutes from './routes/invoices.js';
import paymentRoutes from './routes/payments.js';
import expenseRoutes from './routes/expenses.js';
import deliveryRoutes from './routes/deliveries.js';
import salesRoutes from './routes/sales.js';
import dashboardRoutes from './routes/dashboard.js';
import reportRoutes from './routes/reports.js';
import attachmentRoutes from './routes/attachments.js';
import notificationRoutes from './routes/notifications.js';
import { prisma } from './lib/prisma.js';

const app = express();
const PORT = process.env.API_PORT || 3000;

app.use(helmet());
app.use(cors({
  origin: (origin, cb) => {
    const allowed = [
      process.env.CLIENT_URL || 'http://localhost:5173',
      process.env.CORS_ORIGIN || 'http://localhost:5173',
    ].map((url) => url?.replace(/\/$/, ''));
    if (!origin || allowed.includes(origin) || allowed.includes(origin?.replace(/\/$/, ''))) {
      return cb(null, true);
    }
    cb(new Error('CORS not allowed'));
  },
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/health', (_req, res) => {
  res.json({ success: true, data: { status: 'ok' }, message: 'Mando API is running' });
});

app.get('/api/v1/health', (_req, res) => {
  res.json({ success: true, data: { status: 'ok' }, message: 'Mando API is running' });
});

// Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/business', businessRoutes);
app.use('/api/v1/customers', customerRoutes);
app.use('/api/v1/products', productRoutes);
app.use('/api/v1/inventory', inventoryRoutes);
app.use('/api/v1/estimates', estimateRoutes);
app.use('/api/v1/invoices', invoiceRoutes);
app.use('/api/v1/payments', paymentRoutes);
app.use('/api/v1/expenses', expenseRoutes);
app.use('/api/v1/deliveries', deliveryRoutes);
app.use('/api/v1/sales', salesRoutes);
app.use('/api/v1/dashboard', dashboardRoutes);
app.use('/api/v1/reports', reportRoutes);
app.use('/api/v1/attachments', attachmentRoutes);
app.use('/api/v1/notifications', notificationRoutes);

// Global error handler (Zod errors, etc.)
app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  if (err instanceof Error && err.name === 'ZodError') {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid request',
        details: (err as any).errors,
      },
    });
  }
  console.error('Unhandled error:', err);
  return res.status(500).json({
    success: false,
    error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' },
  });
});

// Only start the server when not imported as a module (e.g., in tests)
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`Mando API running on http://localhost:${PORT}`);
  });
}

export default app;
