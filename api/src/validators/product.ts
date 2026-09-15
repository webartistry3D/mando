import { z } from 'zod';

export const createProductSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  type: z.enum(['PRODUCT', 'SERVICE']),
  sku: z.string().optional().or(z.literal('')),
  description: z.string().optional(),
  sellingPrice: z.number().min(0, 'Selling price must be >= 0'),
  costPrice: z.number().min(0).default(0),
  unit: z.string().optional(),
  taxEnabled: z.boolean().default(false),
  inventoryTracking: z.boolean().default(false),
  openingStock: z.number().int().min(0).default(0),
  lowStockThreshold: z.number().int().min(0).default(0),
});

export const updateProductSchema = createProductSchema.partial();

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
