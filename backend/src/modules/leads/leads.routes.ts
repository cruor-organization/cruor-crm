import { Router } from 'express';

import { asyncHandler } from '../../middlewares/async-handler.js';
import { requireAuth, requireRole } from '../../middlewares/auth-context.js';

import { leadsController } from './leads.controller.js';

export function leadsRouter(): Router {
  const router = Router();
  router.use(requireAuth());

  router.get('/', asyncHandler(leadsController.list));
  router.get('/:id', asyncHandler(leadsController.get));
  router.post(
    '/',
    requireRole('SALES_REP', 'SALES_MANAGER', 'ADMIN'),
    asyncHandler(leadsController.create),
  );
  router.patch(
    '/:id',
    requireRole('SALES_REP', 'SALES_MANAGER', 'ADMIN'),
    asyncHandler(leadsController.update),
  );
  router.patch(
    '/:id/status',
    requireRole('SALES_REP', 'SALES_MANAGER', 'ADMIN'),
    asyncHandler(leadsController.moveStatus),
  );
  router.post(
    '/:id/convert',
    requireRole('SALES_REP', 'SALES_MANAGER', 'ADMIN'),
    asyncHandler(leadsController.convert),
  );
  router.delete(
    '/:id',
    requireRole('SALES_MANAGER', 'ADMIN'),
    asyncHandler(leadsController.delete),
  );

  return router;
}
