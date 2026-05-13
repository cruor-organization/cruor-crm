import { Router } from 'express';

import { asyncHandler } from '../../middlewares/async-handler.js';
import { requireAuth, requireRole } from '../../middlewares/auth-context.js';

import { customersController } from './customers.controller.js';

export function customersRouter(): Router {
  const router = Router();
  router.use(requireAuth());

  router.get('/', asyncHandler(customersController.list));
  router.get('/:id', asyncHandler(customersController.get));
  router.get('/:id/activities', asyncHandler(customersController.activities));
  router.post(
    '/',
    requireRole('SALES_REP', 'SALES_MANAGER', 'ADMIN'),
    asyncHandler(customersController.create),
  );
  router.patch(
    '/:id',
    requireRole('SALES_REP', 'SALES_MANAGER', 'ADMIN'),
    asyncHandler(customersController.update),
  );
  router.delete('/:id', requireRole('ADMIN'), asyncHandler(customersController.delete));

  return router;
}
