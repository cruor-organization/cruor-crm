import { Router } from 'express';

import { asyncHandler } from '../../middlewares/async-handler.js';
import { requireAuth, requireRole } from '../../middlewares/auth-context.js';

import { stockController } from './stock.controller.js';

export function stockRouter(): Router {
  const router = Router();
  router.use(requireAuth());

  // Locations
  router.get('/locations', asyncHandler(stockController.listLocations));
  router.get('/locations/:id', asyncHandler(stockController.getLocation));
  router.post(
    '/locations',
    requireRole('WAREHOUSE', 'ADMIN'),
    asyncHandler(stockController.createLocation),
  );
  router.patch(
    '/locations/:id',
    requireRole('WAREHOUSE', 'ADMIN'),
    asyncHandler(stockController.updateLocation),
  );
  router.delete(
    '/locations/:id',
    requireRole('ADMIN'),
    asyncHandler(stockController.deactivateLocation),
  );

  // Levels
  router.get('/levels', asyncHandler(stockController.listLevels));

  // Movements (IN/OUT/ADJUST/RETURN)
  router.get('/movements', asyncHandler(stockController.listMovements));
  router.post(
    '/movements',
    requireRole('WAREHOUSE', 'ADMIN'),
    asyncHandler(stockController.createMovement),
  );

  // Reservations
  router.post(
    '/reservations',
    requireRole('SALES_REP', 'SALES_MANAGER', 'ADMIN', 'WAREHOUSE'),
    asyncHandler(stockController.reserve),
  );
  router.delete(
    '/reservations/:movementId',
    requireRole('SALES_REP', 'SALES_MANAGER', 'ADMIN', 'WAREHOUSE'),
    asyncHandler(stockController.release),
  );

  // Transfers
  router.post(
    '/transfers',
    requireRole('WAREHOUSE', 'ADMIN'),
    asyncHandler(stockController.transfer),
  );

  return router;
}
