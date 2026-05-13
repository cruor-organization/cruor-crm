/**
 * Singleton PrismaClient.
 *
 * §2.7 NO MAGIC — sem DI container, apenas reuso de instância no processo.
 * Em dev com HMR/tsx-watch evita esgotar pool por reload constante.
 */
import { PrismaClient } from '@prisma/client';

declare global {
  var __crmPrisma__: PrismaClient | undefined;
}

const isProd = process.env.NODE_ENV === 'production';

export const prisma: PrismaClient =
  globalThis.__crmPrisma__ ??
  new PrismaClient({
    log: isProd ? ['warn', 'error'] : ['warn', 'error', 'query'],
  });

if (!isProd) {
  globalThis.__crmPrisma__ = prisma;
}

export type { Prisma } from '@prisma/client';
