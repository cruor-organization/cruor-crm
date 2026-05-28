import type { Request, Response } from 'express';

import { prisma } from '../../db/index.js';
import { getCtx } from '../../middlewares/auth-context.js';

import { listAuditQuerySchema } from './audit.schemas.js';

export const auditController = {
  async list(req: Request, res: Response): Promise<void> {
    const ctx = getCtx(req);
    const query = listAuditQuerySchema.parse(req.query);
    const where = {
      organizationId: ctx.orgId,
      entityType: query.entityType,
      entityId: query.entityId,
    };
    const [items, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: query.take,
        skip: query.skip,
        include: {
          actor: { select: { id: true, name: true, email: true } },
        },
      }),
      prisma.auditLog.count({ where }),
    ]);
    res.json({ items, total });
  },
};
