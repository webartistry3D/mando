import { z } from 'zod';

export const stockTxnSchema = z.object({
  productId: z.string().min(1, 'Product ID is required'),
  quantity: z.number().int().positive('Quantity must be positive'),
  reason: z.string().optional(),
  referenceType: z.string().optional(),
  referenceId: z.string().optional(),
});

export type StockTxnInput = z.infer<typeof stockTxnSchema>;
