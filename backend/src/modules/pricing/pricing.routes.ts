import { Router } from 'express';

import { asyncHandler } from '../../middlewares/async-handler.js';
import { requireAuth, requireRole } from '../../middlewares/auth-context.js';

import { pricingController } from './pricing.controller.js';

export function pricingRouter(): Router {
  const router = Router();
  router.use(requireAuth());

  // ----- Lists -----
  router.get('/lists', asyncHandler(pricingController.listPriceLists));
  router.get('/lists/:id', asyncHandler(pricingController.getPriceList));
  router.post(
    '/lists',
    requireRole('SALES_MANAGER', 'ADMIN'),
    asyncHandler(pricingController.createPriceList),
  );
  router.patch(
    '/lists/:id',
    requireRole('SALES_MANAGER', 'ADMIN'),
    asyncHandler(pricingController.updatePriceList),
  );
  router.post(
    '/lists/:id/activate',
    requireRole('SALES_MANAGER', 'ADMIN'),
    asyncHandler(pricingController.activatePriceList),
  );
  router.post(
    '/lists/:id/archive',
    requireRole('SALES_MANAGER', 'ADMIN'),
    asyncHandler(pricingController.archivePriceList),
  );
  router.delete(
    '/lists/:id',
    requireRole('ADMIN'),
    asyncHandler(pricingController.deletePriceList),
  );

  // ----- Lines -----
  router.get('/lists/:id/lines', asyncHandler(pricingController.listLines));
  router.post(
    '/lists/:id/lines',
    requireRole('SALES_MANAGER', 'ADMIN'),
    asyncHandler(pricingController.createLine),
  );
  router.patch(
    '/lines/:lineId',
    requireRole('SALES_MANAGER', 'ADMIN'),
    asyncHandler(pricingController.updateLine),
  );
  router.delete(
    '/lines/:lineId',
    requireRole('SALES_MANAGER', 'ADMIN'),
    asyncHandler(pricingController.deleteLine),
  );

  return router;
}
