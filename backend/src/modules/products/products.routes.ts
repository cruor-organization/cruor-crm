import { Router } from 'express';

import { asyncHandler } from '../../middlewares/async-handler.js';
import { requireAuth, requireRole } from '../../middlewares/auth-context.js';

import { productsController } from './products.controller.js';

export function productsRouter(): Router {
  const router = Router();
  router.use(requireAuth());

  router.get('/', asyncHandler(productsController.list));
  // Rota concreta antes da paramétrica para o Express não tratar "variants" como :id.
  router.get('/variants', asyncHandler(productsController.listVariants));
  router.get('/:id', asyncHandler(productsController.get));
  router.patch(
    '/:id/decision',
    requireRole('SALES_MANAGER', 'ADMIN'),
    asyncHandler(productsController.setDecision),
  );
  router.post('/:id/votes', asyncHandler(productsController.vote));
  router.post(
    '/',
    requireRole('SALES_REP', 'SALES_MANAGER', 'ADMIN', 'WAREHOUSE'),
    asyncHandler(productsController.create),
  );
  router.patch(
    '/:id',
    requireRole('SALES_REP', 'SALES_MANAGER', 'ADMIN', 'WAREHOUSE'),
    asyncHandler(productsController.update),
  );
  router.delete('/:id', requireRole('ADMIN'), asyncHandler(productsController.delete));

  return router;
}
