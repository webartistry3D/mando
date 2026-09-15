import { prisma } from './prisma.js';

interface AuditInput {
  businessId: string;
  userId?: string;
  action: string;
  entityType: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
}

export async function auditLog(input: AuditInput) {
  try {
    await prisma.auditLog.create({
      data: {
        businessId: input.businessId,
        userId: input.userId || null,
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId || null,
        metadata: input.metadata as any || undefined,
      },
    });
  } catch (err) {
    console.error('Audit log failed:', err);
  }
}
