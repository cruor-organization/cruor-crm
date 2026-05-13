/**
 * AuthContext middleware — carrega session + membership e injecta `req.ctx`.
 *
 * Princípio §2.4 (security by default): toda rota protegida assert via
 * `requireAuth` / `requireRole`. Multi-tenant by construction — `ctx.orgId`
 * é o filtro obrigatório em qualquer query de domínio.
 */
import { fromNodeHeaders } from 'better-auth/node';
import type { NextFunction, Request, Response } from 'express';

import type { Auth } from '../auth/index.js';
import { prisma } from '../db/index.js';
import { ForbiddenError, UnauthorizedError } from '../shared/errors.js';
import { type AppRole, hasAnyRole, isAppRole } from '../shared/rbac.js';

export interface AuthContext {
  actorId: string;
  email: string;
  orgId: string;
  role: AppRole;
}

/**
 * Lê a sessão via Better Auth e popula `req.ctx`. NÃO falha se não houver
 * sessão — apenas omite o ctx. As guards (`requireAuth`/`requireRole`) fazem
 * o assert.
 */
export function attachAuthContext(auth: Auth) {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      const session = await auth.api.getSession({ headers: fromNodeHeaders(req.headers) });
      if (!session) return next();

      const userId = session.user.id;
      const activeOrgId = session.session.activeOrganizationId;

      // Resolver org ativa: usa a da sessão; senão pega na primeira membership.
      let orgId = activeOrgId;
      let role: AppRole | null = null;

      if (orgId) {
        const member = await prisma.member.findFirst({
          where: { userId, organizationId: orgId },
          select: { role: true },
        });
        if (member && isAppRole(member.role)) role = member.role;
      }
      if (!role) {
        const fallback = await prisma.member.findFirst({
          where: { userId },
          select: { role: true, organizationId: true },
          orderBy: { createdAt: 'asc' },
        });
        if (fallback && isAppRole(fallback.role)) {
          role = fallback.role;
          orgId = fallback.organizationId;
        }
      }

      if (orgId && role) {
        req.ctx = {
          actorId: userId,
          email: session.user.email,
          orgId,
          role,
        };
      }
      next();
    } catch (err) {
      next(err);
    }
  };
}

export function requireAuth() {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.ctx) return next(new UnauthorizedError());
    next();
  };
}

export function requireRole(...roles: AppRole[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.ctx) return next(new UnauthorizedError());
    if (!hasAnyRole(req.ctx.role, roles)) {
      return next(new ForbiddenError('INSUFFICIENT_ROLE', `Requer um de: ${roles.join(', ')}`));
    }
    next();
  };
}

/** Helper para code legível em controllers/services. */
export function getCtx(req: Request): AuthContext {
  if (!req.ctx) throw new UnauthorizedError();
  return req.ctx;
}
