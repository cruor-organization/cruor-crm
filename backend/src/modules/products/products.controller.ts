import type { Request, Response } from 'express';

import { getCtx } from '../../middlewares/auth-context.js';

import {
  createProductSchema,
  listProductsQuerySchema,
  setDecisionSchema,
  updateProductSchema,
  voteProductSchema,
} from './products.schemas.js';
import { productsService } from './products.service.js';

export const productsController = {
  async list(req: Request, res: Response): Promise<void> {
    const ctx = getCtx(req);
    res.json(await productsService.list(ctx, listProductsQuerySchema.parse(req.query)));
  },

  async get(req: Request, res: Response): Promise<void> {
    const ctx = getCtx(req);
    res.json(await productsService.getById(ctx, req.params.id ?? ''));
  },

  async create(req: Request, res: Response): Promise<void> {
    const ctx = getCtx(req);
    const product = await productsService.create(ctx, createProductSchema.parse(req.body));
    res.status(201).json(product);
  },

  async update(req: Request, res: Response): Promise<void> {
    const ctx = getCtx(req);
    const product = await productsService.update(
      ctx,
      req.params.id ?? '',
      updateProductSchema.parse(req.body),
    );
    res.json(product);
  },

  async setDecision(req: Request, res: Response): Promise<void> {
    const ctx = getCtx(req);
    const product = await productsService.setDecision(
      ctx,
      req.params.id ?? '',
      setDecisionSchema.parse(req.body),
    );
    res.json(product);
  },

  async vote(req: Request, res: Response): Promise<void> {
    const ctx = getCtx(req);
    const vote = await productsService.vote(
      ctx,
      req.params.id ?? '',
      voteProductSchema.parse(req.body),
    );
    res.json(vote);
  },

  async delete(req: Request, res: Response): Promise<void> {
    const ctx = getCtx(req);
    await productsService.softDelete(ctx, req.params.id ?? '');
    res.status(204).end();
  },
};
