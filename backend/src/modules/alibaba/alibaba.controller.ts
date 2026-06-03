// backend/src/modules/alibaba/alibaba.controller.ts
import type { Request, Response } from 'express';

import { getCtx } from '../../middlewares/auth-context.js';

import type { AlibabaApiPort } from './alibaba-api.port.js';
import { listAlibabaQuerySchema } from './alibaba.schemas.js';
import { alibabaService } from './alibaba.service.js';

/** Factory — o adapter da API é injetado por composição (createApp). */
export function makeAlibabaController(api: AlibabaApiPort) {
  return {
    async list(req: Request, res: Response): Promise<void> {
      const ctx = getCtx(req);
      const query = listAlibabaQuerySchema.parse(req.query);
      res.json(await alibabaService.list(ctx, query));
    },

    async getById(req: Request, res: Response): Promise<void> {
      const ctx = getCtx(req);
      res.json(await alibabaService.getById(ctx, req.params.id ?? ''));
    },

    async sync(req: Request, res: Response): Promise<void> {
      const ctx = getCtx(req);
      res.json(await alibabaService.syncAndApplyToStock(ctx, api));
    },
  };
}
