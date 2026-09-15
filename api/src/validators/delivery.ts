import { z } from 'zod';

export const createDeliverySchema = z.object({
  invoiceId: z.string().optional(),
  customerId: z.string().optional(),
  deliveryAddress: z.string().optional(),
  recipientName: z.string().optional(),
  recipientPhone: z.string().optional(),
  deliveryFee: z.number().min(0).default(0),
  assignedPerson: z.string().optional(),
  trackingReference: z.string().optional(),
  notes: z.string().optional(),
  items: z.array(z.object({
    productId: z.string().optional(),
    description: z.string().min(1),
    quantity: z.number().int().min(1),
  })).optional(),
});

export const updateDeliverySchema = createDeliverySchema.partial().extend({
  status: z.enum(['PENDING', 'PROCESSING', 'OUT_FOR_DELIVERY', 'DELIVERED', 'FAILED', 'CANCELLED']).optional(),
  recipientConfirmation: z.string().optional(),
  proofPhotoAttachmentId: z.string().optional(),
});

export type CreateDeliveryInput = z.infer<typeof createDeliverySchema>;
export type UpdateDeliveryInput = z.infer<typeof updateDeliverySchema>;
