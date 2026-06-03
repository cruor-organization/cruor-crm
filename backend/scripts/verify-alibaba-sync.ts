/**
 * Smoke E2E do sync Alibaba → stock (§10.12) contra Postgres real.
 * Cria uma org descartável, corre o sync DUAS vezes e prova a invariante
 * "stock incrementado exatamente uma vez por encomenda". Limpa tudo no fim
 * (delete da org → cascade apaga variants, stock, movimentos, alibaba_orders).
 *
 * Correr: node node_modules/tsx/dist/cli.mjs scripts/verify-alibaba-sync.ts
 */
import { randomUUID } from 'node:crypto';

import { prisma } from '../src/db/index.js';
import type { AuthContext } from '../src/middlewares/auth-context.js';
import { createAlibabaApi } from '../src/modules/alibaba/alibaba-api.port.js';
import { alibabaService } from '../src/modules/alibaba/alibaba.service.js';

async function main(): Promise<void> {
  const orgId = `verify-${randomUUID()}`;
  const userId = `verify-user-${randomUUID()}`;
  const api = createAlibabaApi('mock');

  try {
    await prisma.organization.create({ data: { id: orgId, name: 'VERIFY Alibaba' } });
    await prisma.user.create({
      data: { id: userId, name: 'Verify', email: `${userId}@verify.local`, emailVerified: true },
    });
    await prisma.member.create({
      data: { id: randomUUID(), organizationId: orgId, userId, role: 'OWNER' },
    });
    const location = await prisma.stockLocation.create({
      data: { organizationId: orgId, code: 'VERIFY', name: 'Verify WH', country: 'PT', isDefault: true },
    });
    const product = await prisma.product.create({
      data: {
        organizationId: orgId,
        sku: `VERIFY-${randomUUID()}`,
        name: 'Verify Product',
        slug: `verify-${randomUUID()}`,
        category: 'DRY_FLOWERS',
        costEur: 1,
      },
    });
    // SKUs têm de casar com o fixture do mock (MOCK-SKU-1 / MOCK-SKU-2)
    for (const sku of ['MOCK-SKU-1', 'MOCK-SKU-2']) {
      await prisma.productVariant.create({
        data: { organizationId: orgId, productId: product.id, sku, label: sku, costEur: 1 },
      });
    }

    const ctx: AuthContext = {
      actorId: userId,
      email: 'verify@verify.local',
      orgId,
      role: 'OWNER',
    };

    const first = await alibabaService.syncAndApplyToStock(ctx, api);
    const second = await alibabaService.syncAndApplyToStock(ctx, api);

    const movements = await prisma.stockMovement.count({
      where: { organizationId: orgId, kind: 'IN', refType: 'PURCHASE' },
    });
    const levels = await prisma.stockLevel.findMany({
      where: { organizationId: orgId, locationId: location.id },
      select: { variantId: true, available: true },
    });
    const totalAvailable = levels.reduce((acc, l) => acc + l.available, 0);

    console.log('1ª sync :', first);
    console.log('2ª sync :', second);
    console.log('movimentos IN PURCHASE :', movements, '(esperado 2)');
    console.log('available total        :', totalAvailable, '(esperado 180 = 120 + 60)');

    const ok =
      first.stockMovementsCreated === 2 &&
      second.stockMovementsCreated === 0 &&
      movements === 2 &&
      totalAvailable === 180;
    console.log(ok ? '\nPASS - exatamente uma vez' : '\nFAIL - invariante violada');
    process.exitCode = ok ? 0 : 1;
  } finally {
    await prisma.organization.delete({ where: { id: orgId } }).catch(() => undefined);
    await prisma.user.delete({ where: { id: userId } }).catch(() => undefined);
    await prisma.$disconnect();
  }
}

void main();
