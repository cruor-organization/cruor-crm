/**
 * Tools de domínio do chatbot (§10.8), executadas pelo backend a pedido do
 * ai-service (HMAC, sem sessão). Todas READ-ONLY e escopadas por orgId vindo do
 * body (assinado, logo confiável). Slice 1: 4 tools com dados já existentes.
 */
import { ProductCategory } from '@prisma/client';
import { Router } from 'express';
import { z } from 'zod';

import { prisma } from '../../db/index.js';
import { asyncHandler } from '../../middlewares/async-handler.js';
import { ValidationError } from '../../shared/errors.js';

const envelopeSchema = z
  .object({ orgId: z.string().min(1), input: z.unknown() })
  .strict();

const handlers: Record<string, (orgId: string, input: unknown) => Promise<unknown>> = {
  async searchProducts(orgId, input) {
    const args = z
      .object({
        query: z.string().min(1),
        category: z.nativeEnum(ProductCategory).optional(),
        limit: z.number().int().min(1).max(20).default(8),
      })
      .strict()
      .parse(input);
    const items = await prisma.product.findMany({
      where: {
        organizationId: orgId,
        status: 'ACTIVE',
        deletedAt: null,
        ...(args.category ? { category: args.category } : {}),
        OR: [
          { name: { contains: args.query, mode: 'insensitive' } },
          { description: { contains: args.query, mode: 'insensitive' } },
          { botanicalName: { contains: args.query, mode: 'insensitive' } },
        ],
      },
      select: {
        id: true,
        sku: true,
        name: true,
        category: true,
        recommendedRetailEur: true,
        dominantColor: true,
      },
      take: args.limit,
      orderBy: { name: 'asc' },
    });
    return { items };
  },

  async getProductAvailability(orgId, input) {
    const args = z.object({ sku: z.string().min(1) }).strict().parse(input);
    const product = await prisma.product.findFirst({
      where: { organizationId: orgId, sku: args.sku, deletedAt: null },
      select: { id: true, sku: true, name: true, leadTimeDays: true, variants: { select: { id: true } } },
    });
    if (!product) return { found: false, sku: args.sku };
    const variantIds = product.variants.map((v) => v.id);
    const levels = variantIds.length
      ? await prisma.stockLevel.findMany({
          where: { organizationId: orgId, variantId: { in: variantIds } },
          select: { available: true, reserved: true },
        })
      : [];
    const available = levels.reduce((a, l) => a + l.available, 0);
    const reserved = levels.reduce((a, l) => a + l.reserved, 0);
    return { found: true, sku: product.sku, name: product.name, available, reserved, leadTimeDays: product.leadTimeDays };
  },

  async getCustomer(orgId, input) {
    const args = z.object({ query: z.string().min(1) }).strict().parse(input);
    const customer = await prisma.customer.findFirst({
      where: {
        organizationId: orgId,
        deletedAt: null,
        OR: [
          { tradingName: { contains: args.query, mode: 'insensitive' } },
          { legalName: { contains: args.query, mode: 'insensitive' } },
          { email: { contains: args.query, mode: 'insensitive' } },
        ],
      },
      select: { id: true, legalName: true, tradingName: true, email: true, phonePrimary: true, status: true },
    });
    if (!customer) return { found: false };
    const recentOrders = await prisma.customerOrder.findMany({
      where: { organizationId: orgId, customerId: customer.id },
      select: { orderNumber: true, status: true, totalEur: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });
    return { found: true, customer, recentOrders };
  },

  async getCustomerOrderHistory(orgId, input) {
    const args = z
      .object({ customerId: z.string().min(1), monthsBack: z.number().int().min(1).max(36).default(12) })
      .strict()
      .parse(input);
    const since = new Date();
    since.setMonth(since.getMonth() - args.monthsBack);
    const orders = await prisma.customerOrder.findMany({
      where: { organizationId: orgId, customerId: args.customerId, createdAt: { gte: since } },
      select: { orderNumber: true, status: true, subtotalEur: true, totalEur: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    return { orders };
  },
};

export function internalToolsRouter(): Router {
  const router = Router();

  router.post(
    '/:name',
    asyncHandler(async (req, res) => {
      const envelope = envelopeSchema.parse(req.body);
      const name = req.params.name ?? '';
      const handler = handlers[name];
      if (!handler) throw new ValidationError('UNKNOWN_TOOL', `Tool desconhecida: ${name}`);
      const output = await handler(envelope.orgId, envelope.input);
      res.json(output);
    }),
  );

  return router;
}
