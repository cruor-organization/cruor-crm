import type { Supplier } from '@prisma/client';

import type { AuthContext } from '../../middlewares/auth-context.js';
import { NotFoundError } from '../../shared/errors.js';
import { writeAudit } from '../audit/audit.service.js';

import { suppliersRepository } from './suppliers.repository.js';
import type {
  CreateSupplierInput,
  ListSuppliersQuery,
  UpdateSupplierInput,
} from './suppliers.schemas.js';

export const suppliersService = {
  list(ctx: AuthContext, query: ListSuppliersQuery) {
    return suppliersRepository.list({
      organizationId: ctx.orgId,
      take: query.take,
      skip: query.skip,
      ...(query.q ? { q: query.q } : {}),
      ...(query.type ? { type: query.type } : {}),
      ...(query.status ? { status: query.status } : {}),
    });
  },

  async getById(ctx: AuthContext, id: string): Promise<Supplier> {
    const supplier = await suppliersRepository.findById(ctx.orgId, id);
    if (!supplier) throw new NotFoundError('SUPPLIER_NOT_FOUND');
    return supplier;
  },

  async create(ctx: AuthContext, input: CreateSupplierInput): Promise<Supplier> {
    const supplier = await suppliersRepository.create({
      organizationId: ctx.orgId,
      name: input.name,
      legalName: input.legalName ?? null,
      country: input.country,
      type: input.type,
      taxId: input.taxId ?? null,
      contacts: input.contacts,
      paymentTerms: input.paymentTerms ?? null,
      incoterms: input.incoterms ?? null,
      defaultLeadTimeDays: input.defaultLeadTimeDays ?? null,
      tags: input.tags,
      notes: input.notes ?? null,
    });
    await writeAudit(ctx, 'supplier', supplier.id, 'CREATE', { name: supplier.name });
    return supplier;
  },

  async update(ctx: AuthContext, id: string, input: UpdateSupplierInput): Promise<Supplier> {
    await this.getById(ctx, id); // 404 se não existe
    const result = await suppliersRepository.update(ctx.orgId, id, input);
    if (result.count === 0) throw new NotFoundError('SUPPLIER_NOT_FOUND');
    await writeAudit(ctx, 'supplier', id, 'UPDATE', input);
    return this.getById(ctx, id);
  },

  async delete(ctx: AuthContext, id: string): Promise<void> {
    await this.getById(ctx, id);
    const result = await suppliersRepository.softDelete(ctx.orgId, id);
    if (result.count === 0) throw new NotFoundError('SUPPLIER_NOT_FOUND');
    await writeAudit(ctx, 'supplier', id, 'DELETE');
  },
};
