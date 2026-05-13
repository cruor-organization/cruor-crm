import type { Request, Response } from 'express';

import { getCtx } from '../../middlewares/auth-context.js';

import {
  createSupplierSchema,
  listSuppliersQuerySchema,
  updateSupplierSchema,
} from './suppliers.schemas.js';
import { suppliersService } from './suppliers.service.js';

export const suppliersController = {
  async list(req: Request, res: Response): Promise<void> {
    const ctx = getCtx(req);
    const query = listSuppliersQuerySchema.parse(req.query);
    const result = await suppliersService.list(ctx, query);
    res.json(result);
  },

  async get(req: Request, res: Response): Promise<void> {
    const ctx = getCtx(req);
    const supplier = await suppliersService.getById(ctx, req.params.id ?? '');
    res.json(supplier);
  },

  async create(req: Request, res: Response): Promise<void> {
    const ctx = getCtx(req);
    const input = createSupplierSchema.parse(req.body);
    const supplier = await suppliersService.create(ctx, input);
    res.status(201).json(supplier);
  },

  async update(req: Request, res: Response): Promise<void> {
    const ctx = getCtx(req);
    const input = updateSupplierSchema.parse(req.body);
    const supplier = await suppliersService.update(ctx, req.params.id ?? '', input);
    res.json(supplier);
  },

  async delete(req: Request, res: Response): Promise<void> {
    const ctx = getCtx(req);
    await suppliersService.delete(ctx, req.params.id ?? '');
    res.status(204).end();
  },
};
