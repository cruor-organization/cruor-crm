// backend/src/modules/quotes/quotes.controller.ts
import type { Request, Response } from 'express';

import { getCtx } from '../../middlewares/auth-context.js';

import {
  createQuoteSchema,
  listQuotesQuerySchema,
  transitionQuoteSchema,
  updateQuoteSchema,
} from './quotes.schemas.js';
import { quotesService } from './quotes.service.js';

export const quotesController = {
  async list(req: Request, res: Response): Promise<void> {
    const ctx = getCtx(req);
    const query = listQuotesQuerySchema.parse(req.query);
    res.json(await quotesService.list(ctx, query));
  },

  async getById(req: Request, res: Response): Promise<void> {
    const ctx = getCtx(req);
    res.json(await quotesService.getById(ctx, req.params.id ?? ''));
  },

  async create(req: Request, res: Response): Promise<void> {
    const ctx = getCtx(req);
    const input = createQuoteSchema.parse(req.body);
    res.status(201).json(await quotesService.create(ctx, input));
  },

  async update(req: Request, res: Response): Promise<void> {
    const ctx = getCtx(req);
    const input = updateQuoteSchema.parse(req.body);
    res.json(await quotesService.updateHeader(ctx, req.params.id ?? '', input));
  },

  async remove(req: Request, res: Response): Promise<void> {
    const ctx = getCtx(req);
    await quotesService.delete(ctx, req.params.id ?? '');
    res.status(204).end();
  },

  async transition(req: Request, res: Response): Promise<void> {
    const ctx = getCtx(req);
    const input = transitionQuoteSchema.parse(req.body);
    res.json(await quotesService.transition(ctx, req.params.id ?? '', input));
  },
};
