import { z } from 'zod';

const estimateItemSchema = z.object({
  productId: z.string().optional(),
  description: z.string().min(1, 'Description is required'),
  quantity: z.number().int().min(1),
  unitPrice: z.number().min(0),
  discount: z.number().min(0).default(0),
  tax: z.number().min(0).default(0),
});

export const createEstimateSchema = z.object({
  customerId: z.string().min(1, 'Customer is required'),
  number: z.string().optional(),
  issueDate: z.string().optional(),
  expiryDate: z.string().optional(),
  items: z.array(estimateItemSchema).min(1, 'At least one item is required'),
  discount: z.number().min(0).default(0),
  tax: z.number().min(0).default(0),
  deliveryFee: z.number().min(0).default(0),
  notes: z.string().optional(),
  terms: z.string().optional(),
});

export const updateEstimateSchema = createEstimateSchema.partial().extend({
  status: z.enum(['DRAFT', 'SENT', 'VIEWED', 'ACCEPTED', 'REJECTED', 'EXPIRED']).optional(),
});

export type CreateEstimateInput = z.infer<typeof createEstimateSchema>;
export type UpdateEstimateInput = z.infer<typeof updateEstimateSchema>;
