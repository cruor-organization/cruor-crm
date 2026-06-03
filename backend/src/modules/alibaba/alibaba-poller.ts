// backend/src/modules/alibaba/alibaba-poller.ts
/**
 * Poller em background do sync Alibaba → stock (§10.12). Desligado por defeito
 * (ALIBABA_SYNC_ENABLED). O single-flight entre processos é garantido pelo
 * pg_try_advisory_xact_lock no serviço; este setInterval só agenda e evita
 * sobreposição dentro do mesmo processo.
 *
 * TODO(alibaba): em produção migrar para BullMQ repeatable (5min) + Redis SETNX
 * (TTL 4min) + SSE para push ao detetar diff. Aqui evitamos infra extra (Redis).
 */
import { prisma } from '../../db/index.js';
import type { AuthContext } from '../../middlewares/auth-context.js';
import { isAppRole } from '../../shared/rbac.js';

import type { AlibabaApiPort } from './alibaba-api.port.js';
import { alibabaService } from './alibaba.service.js';

export interface PollerHandle {
  stop(): void;
}

export function startAlibabaPoller(opts: { api: AlibabaApiPort; intervalMs: number }): PollerHandle {
  let running = false;

  const tick = async (): Promise<void> => {
    if (running) return; // não sobrepõe ticks no mesmo processo
    running = true;
    try {
      const orgs = await prisma.organization.findMany({ select: { id: true } });
      for (const org of orgs) {
        const ctx = await systemContextForOrg(org.id);
        if (!ctx) continue; // org sem OWNER/ADMIN — sem actor a quem atribuir
        try {
          await alibabaService.syncAndApplyToStock(ctx, opts.api);
        } catch (err) {
          console.error(`[alibaba-poller] sync falhou para org ${org.id}:`, err);
        }
      }
    } finally {
      running = false;
    }
  };

  const timer = setInterval(() => void tick(), opts.intervalMs);
  timer.unref();
  return { stop: () => clearInterval(timer) };
}

/** Atribui o sync automático a um OWNER/ADMIN real (actorId é FK → user). */
async function systemContextForOrg(orgId: string): Promise<AuthContext | null> {
  const member = await prisma.member.findFirst({
    where: { organizationId: orgId, role: { in: ['OWNER', 'ADMIN'] } },
    select: { userId: true, role: true, user: { select: { email: true } } },
  });
  if (!member || !isAppRole(member.role)) return null;
  return { actorId: member.userId, email: member.user.email, orgId, role: member.role };
}
