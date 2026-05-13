import type { Request, Response } from 'express';

import { getCtx } from '../../middlewares/auth-context.js';

import {
  convertLeadSchema,
  createLeadSchema,
  listLeadsQuerySchema,
  moveLeadStatusSchema,
  updateLeadSchema,
} from './leads.schemas.js';
import { leadsService } from './leads.service.js';

export const leadsController = {
  async list(req: Request, res: Response): Promise<void> {
    const ctx = getCtx(req);
    res.json(await leadsService.list(ctx, listLeadsQuerySchema.parse(req.query)));
  },

  async get(req: Request, res: Response): Promise<void> {
    const ctx = getCtx(req);
    res.json(await leadsService.getById(ctx, req.params.id ?? ''));
  },

  async create(req: Request, res: Response): Promise<void> {
    const ctx = getCtx(req);
    const lead = await leadsService.create(ctx, createLeadSchema.parse(req.body));
    res.status(201).json(lead);
  },

  async update(req: Request, res: Response): Promise<void> {
    const ctx = getCtx(req);
    const lead = await leadsService.update(
      ctx,
      req.params.id ?? '',
      updateLeadSchema.parse(req.body),
    );
    res.json(lead);
  },

  async moveStatus(req: Request, res: Response): Promise<void> {
    const ctx = getCtx(req);
    const lead = await leadsService.moveStatus(
      ctx,
      req.params.id ?? '',
      moveLeadStatusSchema.parse(req.body),
    );
    res.json(lead);
  },

  async convert(req: Request, res: Response): Promise<void> {
    const ctx = getCtx(req);
    const customer = await leadsService.convert(
      ctx,
      req.params.id ?? '',
      convertLeadSchema.parse(req.body),
    );
    res.status(201).json(customer);
  },

  async delete(req: Request, res: Response): Promise<void> {
    const ctx = getCtx(req);
    await leadsService.softDelete(ctx, req.params.id ?? '');
    res.status(204).end();
  },
};
