import { Router } from 'express';

import { asyncHandler } from '../../middlewares/async-handler.js';
import { requireAuth, requireRole } from '../../middlewares/auth-context.js';

import { makeEmbeddingsController } from './embeddings.controller.js';
import type { EmbeddingsService } from './embeddings.service.js';

export function embeddingsRouter(service: EmbeddingsService): Router {
  const router = Router();
  const controller = makeEmbeddingsController(service);
  router.use(requireAuth());

  // Backfill é operação pesada/administrativa.
  router.post(
    '/backfill/products',
    requireRole('SALES_MANAGER', 'ADMIN'),
    asyncHandler(controller.backfillProducts),
  );

  return router;
}
