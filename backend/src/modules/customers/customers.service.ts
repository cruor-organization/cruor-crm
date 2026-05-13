import type { Customer } from '@prisma/client';

import { prisma } from '../../db/index.js';
import type { AuthContext } from '../../middlewares/auth-context.js';
import { ForbiddenError, NotFoundError } from '../../shared/errors.js';
import { hasAnyRole } from '../../shared/rbac.js';
import { writeAudit } from '../audit/audit.service.js';

import { customersRepository } from './customers.repository.js';
import type {
  CreateCustomerInput,
  ListCustomersQuery,
  UpdateCustomerInput,
} from './customers.schemas.js';

/**
 * §8 ABAC: SALES_REP só vê os seus customers; SALES_MANAGER+ vê tudo.
 */
function scopeForRole(ctx: AuthContext): { salesRepId?: string } {
  if (hasAnyRole(ctx.role, ['SALES_MANAGER', 'ADMIN', 'OWNER'])) return {};
  if (ctx.role === 'SALES_REP') return { salesRepId: ctx.actorId };
  return {};
}

export const customersService = {
  list(ctx: AuthContext, query: ListCustomersQuery) {
    const scope = scopeForRole(ctx);
    return customersRepository.list({
      organizationId: ctx.orgId,
      take: query.take,
      skip: query.skip,
      ...(query.q ? { q: query.q } : {}),
      ...(query.status ? { status: query.status } : {}),
      ...(query.tier ? { tier: query.tier } : {}),
      // Query trumps scope só se o role pode ver tudo.
      ...(scope.salesRepId
        ? { salesRepId: scope.salesRepId }
        : query.salesRepId
          ? { salesRepId: query.salesRepId }
          : {}),
    });
  },

  async getById(ctx: AuthContext, id: string): Promise<Customer> {
    const customer = await customersRepository.findById(ctx.orgId, id);
    if (!customer) throw new NotFoundError('CUSTOMER_NOT_FOUND');
    // SALES_REP só vê os seus.
    if (ctx.role === 'SALES_REP' && customer.salesRepId !== ctx.actorId) {
      throw new ForbiddenError('CUSTOMER_NOT_ASSIGNED_TO_REP');
    }
    return customer;
  },

  async create(ctx: AuthContext, input: CreateCustomerInput): Promise<Customer> {
    return prisma.$transaction(async (tx) => {
      const customer = await tx.customer.create({
        data: {
          organizationId: ctx.orgId,
          businessType: input.businessType,
          legalName: input.legalName,
          tradingName: input.tradingName ?? null,
          taxId: input.taxId ?? null,
          taxCountry: input.taxCountry ?? null,
          addresses: input.addresses,
          contacts: input.contacts,
          phonePrimary: input.phonePrimary ?? null,
          whatsappNumber: input.whatsappNumber ?? null,
          email: input.email ?? null,
          website: input.website ?? null,
          instagramHandle: input.instagramHandle ?? null,
          pricingTier: input.pricingTier,
          // Quando SALES_REP cria, o cliente fica atribuído a ele por defeito.
          salesRepId: input.salesRepId ?? (ctx.role === 'SALES_REP' ? ctx.actorId : null),
          creditLimitEur: input.creditLimitEur,
          paymentTermDays: input.paymentTermDays,
          preferredChannel: input.preferredChannel ?? null,
          preferredDeliveryDay: input.preferredDeliveryDay ?? null,
          shopSizeSqm: input.shopSizeSqm ?? null,
          estimatedMonthlyVolumeEur: input.estimatedMonthlyVolumeEur ?? null,
          peakSeasons: input.peakSeasons,
          status: input.status,
          geoLat: input.geoLat ?? null,
          geoLng: input.geoLng ?? null,
          deliveryZone: input.deliveryZone ?? null,
        },
      });
      await tx.customerActivity.create({
        data: {
          organizationId: ctx.orgId,
          customerId: customer.id,
          actorId: ctx.actorId,
          kind: 'NOTE',
          payload: { event: 'CUSTOMER_CREATED' },
        },
      });
      return customer;
    });
  },

  async update(ctx: AuthContext, id: string, input: UpdateCustomerInput): Promise<Customer> {
    const existing = await this.getById(ctx, id); // 404 + ABAC
    const result = await customersRepository.update(ctx.orgId, id, input);
    if (result.count === 0) throw new NotFoundError('CUSTOMER_NOT_FOUND');

    // Activity para mudança de status.
    if (input.status && input.status !== existing.status) {
      await prisma.customerActivity.create({
        data: {
          organizationId: ctx.orgId,
          customerId: id,
          actorId: ctx.actorId,
          kind: 'STATUS_CHANGED',
          payload: { from: existing.status, to: input.status },
        },
      });
    }

    await writeAudit(ctx, 'customer', id, 'UPDATE', input);
    return this.getById(ctx, id);
  },

  async delete(ctx: AuthContext, id: string): Promise<void> {
    await this.getById(ctx, id);
    const result = await customersRepository.softDelete(ctx.orgId, id);
    if (result.count === 0) throw new NotFoundError('CUSTOMER_NOT_FOUND');
    await writeAudit(ctx, 'customer', id, 'DELETE');
  },

  /**
   * Cronologia de atividade (chamadas, visitas, encomendas, mensagens).
   */
  async getActivities(ctx: AuthContext, customerId: string, limit = 50) {
    await this.getById(ctx, customerId); // valida ABAC
    return prisma.customerActivity.findMany({
      where: { organizationId: ctx.orgId, customerId },
      orderBy: { occurredAt: 'desc' },
      take: Math.min(limit, 200),
    });
  },
};
