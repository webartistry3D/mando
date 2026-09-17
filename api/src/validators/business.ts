import { z } from 'zod';

export const updateBusinessSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  logoAttachmentId: z.string().nullable().optional(),
  cacNumber: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  email: z.string().email().nullable().optional(),
});

export const updateBusinessSettingsSchema = z.object({
  currency: z.string().max(10).optional(),
  invoicePrefix: z.string().max(20).optional(),
  estimatePrefix: z.string().max(20).optional(),
  deliveryPrefix: z.string().max(20).optional(),
  taxEnabled: z.boolean().optional(),
  taxRate: z.number().min(0).max(100).optional(),
  paymentInstructions: z.string().nullable().optional(),
});

export const addMemberSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Valid email is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['MANAGER', 'STAFF']),
});

export const updateMemberSchema = z.object({
  role: z.enum(['MANAGER', 'STAFF']),
});

export type UpdateBusinessInput = z.infer<typeof updateBusinessSchema>;
export type UpdateBusinessSettingsInput = z.infer<typeof updateBusinessSettingsSchema>;
export type AddMemberInput = z.infer<typeof addMemberSchema>;
export type UpdateMemberInput = z.infer<typeof updateMemberSchema>;
