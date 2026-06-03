// backend/src/modules/invoices/invoices.routes.ts
import { Router } from 'express';

import { asyncHandler } from '../../middlewares/async-handler.js';
import { requireAuth, requireRole } from '../../middlewares/auth-context.js';

import type { InvoiceProviderPort } from './invoice-provider.port.js';
import { makeInvoicesController } from './invoices.controller.js';

export function invoicesRouter(provider: InvoiceProviderPort): Router {
  const router = Router();
  const controller = makeInvoicesController(provider);
  router.use(requireAuth());

  router.get('/', asyncHandler(controller.list));
  router.get('/:id', asyncHandler(controller.getById));
  router.post('/:id/issue', requireRole('SALES_MANAGER', 'ADMIN'), asyncHandler(controller.issue));
  router.post(
    '/:id/payments',
    requireRole('SALES_MANAGER', 'ADMIN'),
    asyncHandler(controller.registerPayment),
  );
  router.post('/:id/void', requireRole('ADMIN'), asyncHandler(controller.void));

  return router;
}
