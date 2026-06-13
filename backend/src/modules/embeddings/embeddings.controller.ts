import type { Request, Response } from 'express';

import { getCtx } from '../../middlewares/auth-context.js';

import type { EmbeddingsService } from './embeddings.service.js';

export function makeEmbeddingsController(service: EmbeddingsService) {
  return {
    async backfillProducts(req: Request, res: Response): Promise<void> {
      const ctx = getCtx(req);
      const result = await service.backfillProducts(ctx);
      res.json(result);
    },
  };
}
