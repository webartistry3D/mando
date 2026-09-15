import { z } from 'zod';

export const createExpenseSchema = z.object({
  categoryId: z.string().min(1, 'Category is required'),
  description: z.string().min(1, 'Description is required'),
  amount: z.number().positive('Amount must be > 0'),
  date: z.string().optional(),
  vendor: z.string().optional(),
  paymentMethod: z.enum(['BANK_TRANSFER', 'POS', 'CASH', 'CARD', 'OTHER']).optional(),
  reference: z.string().optional(),
  notes: z.string().optional(),
});

export const updateExpenseSchema = createExpenseSchema.partial();

export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;
export type UpdateExpenseInput = z.infer<typeof updateExpenseSchema>;
