/**
 * Audit log — escrita explícita pelos services para mutations sensíveis.
 * §9 hard invariant: preços, stock, customer mutations registadas.
 *
 * Em Phase 2+ adicionamos Prisma extension para capturar update automaticamente;
 * por agora, services chamam `writeAudit` no fim das mutations.
 */
import type { Prisma } from '@prisma/client';

import { prisma } from '../../db/index.js';
import type { AuthContext } from '../../middlewares/auth-context.js';

export type AuditAction = 'CREATE' | 'UPDATE' | 'DELETE' | 'RESTORE' | 'STATUS_CHANGE';

export async function writeAudit(
  ctx: AuthContext,
  entityType: string,
  entityId: string,
  action: AuditAction,
  changes?: unknown,
): Promise<void> {
  await prisma.auditLog.create({
    data: {
      organizationId: ctx.orgId,
      actorId: ctx.actorId,
      entityType,
      entityId,
      action,
      changes: (changes ?? null) as Prisma.InputJsonValue,
    },
  });
}
