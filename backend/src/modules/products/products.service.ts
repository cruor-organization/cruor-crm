import type { Prisma, Product, ProductVote } from '@prisma/client';

import { prisma } from '../../db/index.js';
import type { AuthContext } from '../../middlewares/auth-context.js';
import { ConflictError, NotFoundError } from '../../shared/errors.js';
import { writeAudit } from '../audit/audit.service.js';

import type {
  CreateProductInput,
  ListProductsQuery,
  SetDecisionInput,
  UpdateProductInput,
  VoteProductInput,
} from './products.schemas.js';

function buildWhere(ctx: AuthContext, query: ListProductsQuery): Prisma.ProductWhereInput {
  return {
    organizationId: ctx.orgId,
    deletedAt: null,
    ...(query.category ? { category: query.category } : {}),
    ...(query.decision ? { decision: query.decision } : {}),
    ...(query.status ? { status: query.status } : {}),
    ...(query.supplierId ? { supplierId: query.supplierId } : {}),
    ...(query.q
      ? {
          OR: [
            { sku: { contains: query.q, mode: 'insensitive' } },
            { name: { contains: query.q, mode: 'insensitive' } },
            { botanicalName: { contains: query.q, mode: 'insensitive' } },
          ],
        }
      : {}),
  };
}

export const productsService = {
  async list(ctx: AuthContext, query: ListProductsQuery) {
    const where = buildWhere(ctx, query);
    const [items, total] = await Promise.all([
      prisma.product.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: query.take,
        skip: query.skip,
      }),
      prisma.product.count({ where }),
    ]);
    return { items, total };
  },

  async getById(ctx: AuthContext, id: string): Promise<Product> {
    const product = await prisma.product.findFirst({
      where: { id, organizationId: ctx.orgId, deletedAt: null },
      include: { variants: true, media: { orderBy: { position: 'asc' } }, votes: true },
    });
    if (!product) throw new NotFoundError('PRODUCT_NOT_FOUND');
    return product;
  },

  async create(ctx: AuthContext, input: CreateProductInput): Promise<Product> {
    // SKU + slug são unique por org — verificar antes para devolver erro claro.
    const conflict = await prisma.product.findFirst({
      where: {
        organizationId: ctx.orgId,
        OR: [{ sku: input.sku }, { slug: input.slug }],
      },
      select: { id: true },
    });
    if (conflict) throw new ConflictError('PRODUCT_SKU_OR_SLUG_EXISTS');

    const product = await prisma.product.create({
      data: {
        organizationId: ctx.orgId,
        sku: input.sku,
        name: input.name,
        slug: input.slug,
        category: input.category,
        subcategory: input.subcategory ?? null,
        description: input.description ?? null,
        shortDescription: input.shortDescription ?? null,
        brand: input.brand ?? null,
        supplierId: input.supplierId ?? null,
        supplierSku: input.supplierSku ?? null,
        originCountry: input.originCountry ?? null,
        heightCm: input.heightCm ?? null,
        widthCm: input.widthCm ?? null,
        depthCm: input.depthCm ?? null,
        weightG: input.weightG ?? null,
        materialPrimary: input.materialPrimary ?? null,
        finish: input.finish ?? null,
        dominantColor: input.dominantColor ?? null,
        secondaryColors: input.secondaryColors,
        visualStyle: input.visualStyle ?? null,
        isPreserved: input.isPreserved,
        isDried: input.isDried,
        botanicalName: input.botanicalName ?? null,
        shelfLifeMonths: input.shelfLifeMonths ?? null,
        sensitivityToHumidity: input.sensitivityToHumidity ?? null,
        batchOriginDate: input.batchOriginDate ?? null,
        seasonality: input.seasonality,
        peakMonths: input.peakMonths,
        costEur: input.costEur,
        recommendedRetailEur: input.recommendedRetailEur ?? null,
        moq: input.moq,
        caseSize: input.caseSize,
        leadTimeDays: input.leadTimeDays ?? null,
        isAnchor: input.isAnchor,
        status: input.status,
      },
    });
    await writeAudit(ctx, 'product', product.id, 'CREATE', { sku: product.sku });
    return product;
  },

  async update(ctx: AuthContext, id: string, input: UpdateProductInput): Promise<Product> {
    await this.getById(ctx, id);
    const result = await prisma.product.updateMany({
      where: { id, organizationId: ctx.orgId, deletedAt: null },
      data: input,
    });
    if (result.count === 0) throw new NotFoundError('PRODUCT_NOT_FOUND');
    await writeAudit(ctx, 'product', id, 'UPDATE', input);
    return this.getById(ctx, id);
  },

  async setDecision(ctx: AuthContext, id: string, input: SetDecisionInput): Promise<Product> {
    const existing = await this.getById(ctx, id);
    if (existing.decision === input.decision) return existing;
    await prisma.product.update({
      where: { id },
      data: { decision: input.decision, comment: input.comment ?? null },
    });
    await writeAudit(ctx, 'product', id, 'STATUS_CHANGE', {
      from: existing.decision,
      to: input.decision,
      comment: input.comment ?? null,
    });
    return this.getById(ctx, id);
  },

  async vote(ctx: AuthContext, id: string, input: VoteProductInput): Promise<ProductVote> {
    await this.getById(ctx, id); // 404 + multi-tenant scope
    const vote = await prisma.productVote.upsert({
      where: { productId_userId: { productId: id, userId: ctx.actorId } },
      create: {
        organizationId: ctx.orgId,
        productId: id,
        userId: ctx.actorId,
        score: input.score,
        visualScore: input.visualScore ?? null,
        comment: input.comment ?? null,
      },
      update: {
        score: input.score,
        visualScore: input.visualScore ?? null,
        comment: input.comment ?? null,
      },
    });

    // Recompute aggregated score (média simples por agora).
    const votes = await prisma.productVote.findMany({
      where: { productId: id },
      select: { score: true, visualScore: true },
    });
    const avgScore = votes.reduce((a, v) => a + Number(v.score), 0) / votes.length;
    const visualVotes = votes.filter(
      (v): v is { score: Prisma.Decimal; visualScore: Prisma.Decimal } => v.visualScore != null,
    );
    const avgVisual = visualVotes.length
      ? visualVotes.reduce((a, v) => a + Number(v.visualScore), 0) / visualVotes.length
      : null;
    await prisma.product.update({
      where: { id },
      data: { score: avgScore.toFixed(2), visualScore: avgVisual?.toFixed(2) ?? null },
    });
    return vote;
  },

  async softDelete(ctx: AuthContext, id: string): Promise<void> {
    await this.getById(ctx, id);
    const result = await prisma.product.updateMany({
      where: { id, organizationId: ctx.orgId, deletedAt: null },
      data: { deletedAt: new Date(), status: 'DISCONTINUED' },
    });
    if (result.count === 0) throw new NotFoundError('PRODUCT_NOT_FOUND');
    await writeAudit(ctx, 'product', id, 'DELETE');
  },
};
