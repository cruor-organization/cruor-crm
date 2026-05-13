import { Router } from 'express';

import { asyncHandler } from '../../middlewares/async-handler.js';
import { requireAuth, requireRole } from '../../middlewares/auth-context.js';

import { suppliersController } from './suppliers.controller.js';

export function suppliersRouter(): Router {
  const router = Router();
  router.use(requireAuth());

  router.get('/', asyncHandler(suppliersController.list));
  router.get('/:id', asyncHandler(suppliersController.get));
  router.post('/', requireRole('ADMIN', 'SALES_MANAGER'), asyncHandler(suppliersController.create));
  router.patch(
    '/:id',
    requireRole('ADMIN', 'SALES_MANAGER'),
    asyncHandler(suppliersController.update),
  );
  router.delete('/:id', requireRole('ADMIN'), asyncHandler(suppliersController.delete));

  return router;
}
