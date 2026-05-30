// backend/src/modules/orders/orders.controller.ts
import type { Request, Response } from 'express';

import { getCtx } from '../../middlewares/auth-context.js';

import {
  addOrderLineSchema,
  createOrderSchema,
  listOrdersQuerySchema,
  updateOrderLineSchema,
  updateOrderSchema,
} from './orders.schemas.js';
import { ordersService } from './orders.service.js';

export const ordersController = {
  async list(req: Request, res: Response): Promise<void> {
    const ctx = getCtx(req);
    const query = listOrdersQuerySchema.parse(req.query);
    res.json(await ordersService.list(ctx, query));
  },

  async getById(req: Request, res: Response): Promise<void> {
    const ctx = getCtx(req);
    res.json(await ordersService.getById(ctx, req.params.id ?? ''));
  },

  async create(req: Request, res: Response): Promise<void> {
    const ctx = getCtx(req);
    const input = createOrderSchema.parse(req.body);
    res.status(201).json(await ordersService.create(ctx, input));
  },

  async update(req: Request, res: Response): Promise<void> {
    const ctx = getCtx(req);
    const input = updateOrderSchema.parse(req.body);
    res.json(await ordersService.updateHeader(ctx, req.params.id ?? '', input));
  },

  async remove(req: Request, res: Response): Promise<void> {
    const ctx = getCtx(req);
    await ordersService.delete(ctx, req.params.id ?? '');
    res.status(204).end();
  },

  async addLine(req: Request, res: Response): Promise<void> {
    const ctx = getCtx(req);
    const input = addOrderLineSchema.parse(req.body);
    res.status(201).json(await ordersService.addLine(ctx, req.params.id ?? '', input));
  },

  async updateLine(req: Request, res: Response): Promise<void> {
    const ctx = getCtx(req);
    const input = updateOrderLineSchema.parse(req.body);
    res.json(
      await ordersService.updateLine(ctx, req.params.id ?? '', req.params.lineId ?? '', input),
    );
  },

  async deleteLine(req: Request, res: Response): Promise<void> {
    const ctx = getCtx(req);
    res.json(await ordersService.deleteLine(ctx, req.params.id ?? '', req.params.lineId ?? ''));
  },
};
