import { z } from 'zod';

export const createPaymentSchema = z.object({
  invoiceId: z.string().optional(),
  customerId: z.string().optional(),
  amount: z.number().positive('Amount must be > 0'),
  paymentMethod: z.enum(['BANK_TRANSFER', 'POS', 'CASH', 'CARD', 'OTHER']),
  paymentDate: z.string().optional(),
  reference: z.string().optional(),
  description: z.string().optional(),
  notes: z.string().optional(),
});

export const updatePaymentSchema = createPaymentSchema.partial();

export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;
export type UpdatePaymentInput = z.infer<typeof updatePaymentSchema>;
