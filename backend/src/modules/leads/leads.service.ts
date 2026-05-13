import type { Customer, CustomerLead, Prisma } from '@prisma/client';

import { prisma } from '../../db/index.js';
import { scoreLead } from '../../domain/customers/lead-scoring.js';
import type { AuthContext } from '../../middlewares/auth-context.js';
import { ConflictError, ForbiddenError, NotFoundError } from '../../shared/errors.js';
import { hasAnyRole } from '../../shared/rbac.js';
import { writeAudit } from '../audit/audit.service.js';

import type {
  ConvertLeadInput,
  CreateLeadInput,
  ListLeadsQuery,
  MoveLeadStatusInput,
  UpdateLeadInput,
} from './leads.schemas.js';

function scopeForRole(ctx: AuthContext): { salesRepId?: string } {
  if (hasAnyRole(ctx.role, ['SALES_MANAGER', 'ADMIN', 'OWNER'])) return {};
  if (ctx.role === 'SALES_REP') return { salesRepId: ctx.actorId };
  return {};
}

function decimalOrNull(v: number | undefined | null): number | null {
  return v ?? null;
}

function recomputeScore(input: Partial<CreateLeadInput>, current?: CustomerLead): number {
  return scoreLead({
    businessType: input.businessType ?? current?.businessType ?? null,
    estimatedMonthlyVolumeEur:
      input.estimatedMonthlyVolumeEur !== undefined
        ? Number(input.estimatedMonthlyVolumeEur)
        : current?.estimatedMonthlyVolumeEur != null
          ? Number(current.estimatedMonthlyVolumeEur)
          : null,
    instagramFollowers: input.instagramFollowers ?? current?.instagramFollowers ?? null,
    shopSizeSqm: input.shopSizeSqm ?? current?.shopSizeSqm ?? null,
    geoZone: input.geoZone ?? current?.geoZone ?? null,
    source: input.source ?? current?.source ?? 'OTHER',
  });
}

export const leadsService = {
  async list(ctx: AuthContext, query: ListLeadsQuery) {
    const scope = scopeForRole(ctx);
    const where: Prisma.CustomerLeadWhereInput = {
      organizationId: ctx.orgId,
      deletedAt: null,
      ...(query.status ? { status: query.status } : {}),
      ...(query.source ? { source: query.source } : {}),
      ...(scope.salesRepId
        ? { salesRepId: scope.salesRepId }
        : query.salesRepId
          ? { salesRepId: query.salesRepId }
          : {}),
      ...(query.q
        ? {
            OR: [
              { tradingName: { contains: query.q, mode: 'insensitive' } },
              { legalName: { contains: query.q, mode: 'insensitive' } },
              { email: { contains: query.q, mode: 'insensitive' } },
            ],
          }
        : {}),
    };
    const [items, total] = await Promise.all([
      prisma.customerLead.findMany({
        where,
        orderBy: [{ status: 'asc' }, { score: 'desc' }, { createdAt: 'desc' }],
        take: query.take,
        skip: query.skip,
      }),
      prisma.customerLead.count({ where }),
    ]);
    return { items, total };
  },

  async getById(ctx: AuthContext, id: string): Promise<CustomerLead> {
    const lead = await prisma.customerLead.findFirst({
      where: { id, organizationId: ctx.orgId, deletedAt: null },
    });
    if (!lead) throw new NotFoundError('LEAD_NOT_FOUND');
    if (ctx.role === 'SALES_REP' && lead.salesRepId && lead.salesRepId !== ctx.actorId) {
      throw new ForbiddenError('LEAD_NOT_ASSIGNED_TO_REP');
    }
    return lead;
  },

  async create(ctx: AuthContext, input: CreateLeadInput): Promise<CustomerLead> {
    const score = recomputeScore(input);
    return prisma.customerLead.create({
      data: {
        organizationId: ctx.orgId,
        tradingName: input.tradingName,
        legalName: input.legalName ?? null,
        email: input.email ?? null,
        phone: input.phone ?? null,
        whatsappNumber: input.whatsappNumber ?? null,
        source: input.source,
        businessType: input.businessType ?? null,
        instagramHandle: input.instagramHandle ?? null,
        instagramFollowers: decimalOrNull(input.instagramFollowers),
        shopSizeSqm: decimalOrNull(input.shopSizeSqm),
        estimatedMonthlyVolumeEur: input.estimatedMonthlyVolumeEur ?? null,
        geoZone: input.geoZone ?? null,
        notes: input.notes ?? null,
        status: input.status,
        salesRepId: input.salesRepId ?? (ctx.role === 'SALES_REP' ? ctx.actorId : null),
        score,
      },
    });
  },

  async update(ctx: AuthContext, id: string, input: UpdateLeadInput): Promise<CustomerLead> {
    const existing = await this.getById(ctx, id);
    if (existing.convertedAt) {
      throw new ConflictError('LEAD_ALREADY_CONVERTED');
    }
    const score = recomputeScore(input, existing);
    await prisma.customerLead.updateMany({
      where: { id, organizationId: ctx.orgId, deletedAt: null },
      data: { ...input, score },
    });
    await writeAudit(ctx, 'customer_lead', id, 'UPDATE', { ...input, score });
    return this.getById(ctx, id);
  },

  async moveStatus(
    ctx: AuthContext,
    id: string,
    input: MoveLeadStatusInput,
  ): Promise<CustomerLead> {
    const existing = await this.getById(ctx, id);
    if (existing.convertedAt) throw new ConflictError('LEAD_ALREADY_CONVERTED');
    if (existing.status === input.status) return existing;

    await prisma.customerLead.update({
      where: { id },
      data: { status: input.status },
    });
    await writeAudit(ctx, 'customer_lead', id, 'STATUS_CHANGE', {
      from: existing.status,
      to: input.status,
    });
    return this.getById(ctx, id);
  },

  /**
   * Promove Lead → Customer (§10.3 few-shot 1).
   */
  async convert(ctx: AuthContext, leadId: string, data: ConvertLeadInput): Promise<Customer> {
    return prisma.$transaction(async (tx) => {
      const lead = await tx.customerLead.findFirst({
        where: { id: leadId, organizationId: ctx.orgId, deletedAt: null },
      });
      if (!lead) throw new NotFoundError('LEAD_NOT_FOUND');
      if (lead.convertedAt) throw new ConflictError('LEAD_ALREADY_CONVERTED');
      if (ctx.role === 'SALES_REP' && lead.salesRepId && lead.salesRepId !== ctx.actorId) {
        throw new ForbiddenError('LEAD_NOT_ASSIGNED_TO_REP');
      }

      const customer = await tx.customer.create({
        data: {
          organizationId: ctx.orgId,
          salesRepId: lead.salesRepId ?? ctx.actorId,
          businessType: data.businessType,
          legalName: data.legalName,
          tradingName: lead.tradingName,
          taxId: data.taxId,
          taxCountry: data.taxCountry,
          phonePrimary: lead.phone,
          whatsappNumber: lead.whatsappNumber,
          email: lead.email,
          pricingTier: data.pricingTier,
          status: 'ACTIVE',
          shopSizeSqm: lead.shopSizeSqm,
          estimatedMonthlyVolumeEur: lead.estimatedMonthlyVolumeEur,
          deliveryZone: lead.geoZone,
        },
      });

      await tx.customerLead.update({
        where: { id: leadId },
        data: {
          convertedAt: new Date(),
          convertedToCustomerId: customer.id,
          status: 'WON',
        },
      });

      await tx.customerActivity.create({
        data: {
          organizationId: ctx.orgId,
          customerId: customer.id,
          actorId: ctx.actorId,
          kind: 'CONVERTED_FROM_LEAD',
          payload: { leadId },
        },
      });

      await tx.auditLog.create({
        data: {
          organizationId: ctx.orgId,
          actorId: ctx.actorId,
          entityType: 'customer_lead',
          entityId: leadId,
          action: 'STATUS_CHANGE',
          changes: { converted: true, customerId: customer.id },
        },
      });

      return customer;
    });
  },

  async softDelete(ctx: AuthContext, id: string): Promise<void> {
    await this.getById(ctx, id);
    await prisma.customerLead.updateMany({
      where: { id, organizationId: ctx.orgId, deletedAt: null },
      data: { deletedAt: new Date(), status: 'LOST' },
    });
    await writeAudit(ctx, 'customer_lead', id, 'DELETE');
  },
};
