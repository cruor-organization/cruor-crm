// backend/src/modules/returns/returns.controller.ts
import type { Request, Response } from 'express';

import { getCtx } from '../../middlewares/auth-context.js';

import {
  createReturnSchema,
  decideReturnSchema,
  listReturnsQuerySchema,
  receiveReturnSchema,
} from './returns.schemas.js';
import { returnsService } from './returns.service.js';

export const returnsController = {
  async list(req: Request, res: Response): Promise<void> {
    const ctx = getCtx(req);
    const query = listReturnsQuerySchema.parse(req.query);
    res.json(await returnsService.list(ctx, query));
  },

  async getById(req: Request, res: Response): Promise<void> {
    const ctx = getCtx(req);
    res.json(await returnsService.getById(ctx, req.params.id ?? ''));
  },

  async create(req: Request, res: Response): Promise<void> {
    const ctx = getCtx(req);
    const input = createReturnSchema.parse(req.body);
    res.status(201).json(await returnsService.create(ctx, input));
  },

  async receive(req: Request, res: Response): Promise<void> {
    const ctx = getCtx(req);
    const input = receiveReturnSchema.parse(req.body);
    res.json(await returnsService.receive(ctx, req.params.id ?? '', input));
  },

  async decide(req: Request, res: Response): Promise<void> {
    const ctx = getCtx(req);
    const input = decideReturnSchema.parse(req.body);
    res.json(await returnsService.decide(ctx, req.params.id ?? '', input));
  },
};
