import type { Request, Response } from 'express';
import { z } from 'zod';

import { getCtx } from '../../middlewares/auth-context.js';

import {
  createCustomerSchema,
  listCustomersQuerySchema,
  updateCustomerSchema,
} from './customers.schemas.js';
import { customersService } from './customers.service.js';

const activitiesQuerySchema = z
  .object({ limit: z.coerce.number().int().min(1).max(200).default(50) })
  .strict();

export const customersController = {
  async list(req: Request, res: Response): Promise<void> {
    const ctx = getCtx(req);
    const query = listCustomersQuerySchema.parse(req.query);
    res.json(await customersService.list(ctx, query));
  },

  async get(req: Request, res: Response): Promise<void> {
    const ctx = getCtx(req);
    res.json(await customersService.getById(ctx, req.params.id ?? ''));
  },

  async create(req: Request, res: Response): Promise<void> {
    const ctx = getCtx(req);
    const input = createCustomerSchema.parse(req.body);
    res.status(201).json(await customersService.create(ctx, input));
  },

  async update(req: Request, res: Response): Promise<void> {
    const ctx = getCtx(req);
    const input = updateCustomerSchema.parse(req.body);
    res.json(await customersService.update(ctx, req.params.id ?? '', input));
  },

  async delete(req: Request, res: Response): Promise<void> {
    const ctx = getCtx(req);
    await customersService.delete(ctx, req.params.id ?? '');
    res.status(204).end();
  },

  async activities(req: Request, res: Response): Promise<void> {
    const ctx = getCtx(req);
    const { limit } = activitiesQuerySchema.parse(req.query);
    res.json(await customersService.getActivities(ctx, req.params.id ?? '', limit));
  },
};
