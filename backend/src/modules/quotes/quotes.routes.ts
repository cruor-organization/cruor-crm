// backend/src/modules/quotes/quotes.routes.ts
import { Router } from 'express';

import { asyncHandler } from '../../middlewares/async-handler.js';
import { requireAuth, requireRole } from '../../middlewares/auth-context.js';

import { quotesController } from './quotes.controller.js';

const SALES = ['SALES_REP', 'SALES_MANAGER', 'ADMIN', 'OWNER'] as const;

export function quotesRouter(): Router {
  const router = Router();
  router.use(requireAuth());

  // Leitura: qualquer role autenticado (ABAC filtra no service).
  router.get('/', asyncHandler(quotesController.list));
  router.get('/:id', asyncHandler(quotesController.getById));

  // Mutações: roles de vendas.
  router.post('/', requireRole(...SALES), asyncHandler(quotesController.create));
  router.patch('/:id', requireRole(...SALES), asyncHandler(quotesController.update));
  router.delete('/:id', requireRole(...SALES), asyncHandler(quotesController.remove));
  router.patch('/:id/status', requireRole(...SALES), asyncHandler(quotesController.transition));

  return router;
}
