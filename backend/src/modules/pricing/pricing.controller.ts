import type { Request, Response } from 'express';

import { getCtx } from '../../middlewares/auth-context.js';

import {
  createPriceListSchema,
  listPriceListsQuerySchema,
  updatePriceListSchema,
} from './pricing.schemas.js';
import { pricingService } from './pricing.service.js';

export const pricingController = {
  async listPriceLists(req: Request, res: Response): Promise<void> {
    const ctx = getCtx(req);
    const query = listPriceListsQuerySchema.parse(req.query);
    res.json(await pricingService.listPriceLists(ctx, query));
  },

  async getPriceList(req: Request, res: Response): Promise<void> {
    const ctx = getCtx(req);
    res.json(await pricingService.getPriceList(ctx, req.params.id ?? ''));
  },

  async createPriceList(req: Request, res: Response): Promise<void> {
    const ctx = getCtx(req);
    const input = createPriceListSchema.parse(req.body);
    res.status(201).json(await pricingService.createPriceList(ctx, input));
  },

  async updatePriceList(req: Request, res: Response): Promise<void> {
    const ctx = getCtx(req);
    const input = updatePriceListSchema.parse(req.body);
    res.json(await pricingService.updatePriceList(ctx, req.params.id ?? '', input));
  },

  async activatePriceList(req: Request, res: Response): Promise<void> {
    const ctx = getCtx(req);
    res.json(await pricingService.activatePriceList(ctx, req.params.id ?? ''));
  },

  async archivePriceList(req: Request, res: Response): Promise<void> {
    const ctx = getCtx(req);
    res.json(await pricingService.archivePriceList(ctx, req.params.id ?? ''));
  },

  async deletePriceList(req: Request, res: Response): Promise<void> {
    const ctx = getCtx(req);
    await pricingService.deletePriceList(ctx, req.params.id ?? '');
    res.status(204).end();
  },
};
