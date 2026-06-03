// backend/src/modules/invoices/invoices.controller.ts
import type { Request, Response } from 'express';

import { getCtx } from '../../middlewares/auth-context.js';

import type { InvoiceProviderPort } from './invoice-provider.port.js';
import { listInvoicesQuerySchema, registerPaymentSchema } from './invoices.schemas.js';
import { invoicesService } from './invoices.service.js';

export function makeInvoicesController(provider: InvoiceProviderPort) {
  return {
    async list(req: Request, res: Response): Promise<void> {
      const ctx = getCtx(req);
      const query = listInvoicesQuerySchema.parse(req.query);
      res.json(await invoicesService.list(ctx, query));
    },

    async getById(req: Request, res: Response): Promise<void> {
      const ctx = getCtx(req);
      res.json(await invoicesService.getById(ctx, req.params.id ?? ''));
    },

    async issue(req: Request, res: Response): Promise<void> {
      const ctx = getCtx(req);
      res.json(await invoicesService.issue(ctx, req.params.id ?? '', provider));
    },

    async registerPayment(req: Request, res: Response): Promise<void> {
      const ctx = getCtx(req);
      const input = registerPaymentSchema.parse(req.body);
      res.status(201).json(await invoicesService.registerPayment(ctx, req.params.id ?? '', input));
    },

    async void(req: Request, res: Response): Promise<void> {
      const ctx = getCtx(req);
      res.json(await invoicesService.void(ctx, req.params.id ?? ''));
    },
  };
}
