/**
 * Signup gate — primeiro user = OWNER, restantes ficam invite-only.
 *
 * Estratégia:
 *  1. `before`: contar users. Se > 0 abortar com erro `SIGNUP_DISABLED`.
 *  2. `after`: criar Organization "default" + Member com role "owner".
 *
 * Race: dois pedidos simultâneos podem ambos passar o `before` antes de
 * qualquer user existir. Mitigação: o `after` corre numa transação que faz
 * upsert da Organization e o segundo perde a corrida (Member único por user
 * é garantido pelo `@@unique([organizationId, userId])`).
 *
 * Em Fase 1 substituímos o id de Organization fixo por uma criada no signup.
 */
import { APIError } from 'better-auth/api';

import { prisma } from '../db/index.js';

const DEFAULT_ORG_NAME = 'Organização principal';
const DEFAULT_ORG_SLUG = 'default';

export async function signupGateBefore(): Promise<void> {
  const count = await prisma.user.count();
  if (count > 0) {
    throw new APIError('FORBIDDEN', {
      message: 'Signup desativado. Pede um convite a um administrador.',
      code: 'SIGNUP_DISABLED',
    });
  }
}

export async function signupGateAfter(user: { id: string }): Promise<void> {
  const totalUsers = await prisma.user.count();
  // Só promovemos a OWNER quando este é efetivamente o primeiro user na DB.
  if (totalUsers !== 1) return;

  const org = await prisma.organization.upsert({
    where: { slug: DEFAULT_ORG_SLUG },
    update: {},
    create: {
      id: crypto.randomUUID(),
      name: DEFAULT_ORG_NAME,
      slug: DEFAULT_ORG_SLUG,
    },
  });

  await prisma.member.upsert({
    where: {
      organizationId_userId: {
        organizationId: org.id,
        userId: user.id,
      },
    },
    update: { role: 'OWNER' },
    create: {
      id: crypto.randomUUID(),
      organizationId: org.id,
      userId: user.id,
      role: 'OWNER', // §8 — primeiro user é sempre OWNER
    },
  });
}
