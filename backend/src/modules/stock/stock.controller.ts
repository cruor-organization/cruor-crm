import type { Request, Response } from 'express';

import { getCtx } from '../../middlewares/auth-context.js';

import {
  createMovementSchema,
  createStockLocationSchema,
  listStockLevelsQuerySchema,
  listStockLocationsQuerySchema,
  listStockMovementsQuerySchema,
  reserveStockSchema,
  transferStockSchema,
  updateStockLocationSchema,
} from './stock.schemas.js';
import { stockService } from './stock.service.js';

export const stockController = {
  // Locations
  async listLocations(req: Request, res: Response): Promise<void> {
    const ctx = getCtx(req);
    const query = listStockLocationsQuerySchema.parse(req.query);
    res.json(await stockService.listLocations(ctx, query));
  },

  async getLocation(req: Request, res: Response): Promise<void> {
    const ctx = getCtx(req);
    res.json(await stockService.getLocation(ctx, req.params.id ?? ''));
  },

  async createLocation(req: Request, res: Response): Promise<void> {
    const ctx = getCtx(req);
    const input = createStockLocationSchema.parse(req.body);
    const location = await stockService.createLocation(ctx, input);
    res.status(201).json(location);
  },

  async updateLocation(req: Request, res: Response): Promise<void> {
    const ctx = getCtx(req);
    const input = updateStockLocationSchema.parse(req.body);
    res.json(await stockService.updateLocation(ctx, req.params.id ?? '', input));
  },

  async deactivateLocation(req: Request, res: Response): Promise<void> {
    const ctx = getCtx(req);
    await stockService.deactivateLocation(ctx, req.params.id ?? '');
    res.status(204).end();
  },

  // Levels
  async listLevels(req: Request, res: Response): Promise<void> {
    const ctx = getCtx(req);
    const query = listStockLevelsQuerySchema.parse(req.query);
    res.json(await stockService.listLevels(ctx, query));
  },

  // Movements
  async listMovements(req: Request, res: Response): Promise<void> {
    const ctx = getCtx(req);
    const query = listStockMovementsQuerySchema.parse(req.query);
    res.json(await stockService.listMovements(ctx, query));
  },

  async createMovement(req: Request, res: Response): Promise<void> {
    const ctx = getCtx(req);
    const input = createMovementSchema.parse(req.body);
    const result = await stockService.createMovement(ctx, input);
    res.status(201).json(result);
  },

  async reserve(req: Request, res: Response): Promise<void> {
    const ctx = getCtx(req);
    const input = reserveStockSchema.parse(req.body);
    const result = await stockService.reserve(ctx, input);
    res.status(201).json(result);
  },

  async release(req: Request, res: Response): Promise<void> {
    const ctx = getCtx(req);
    const result = await stockService.release(ctx, req.params.movementId ?? '');
    res.json(result);
  },

  async transfer(req: Request, res: Response): Promise<void> {
    const ctx = getCtx(req);
    const input = transferStockSchema.parse(req.body);
    const result = await stockService.transfer(ctx, input);
    res.status(201).json(result);
  },
};
