// backend/src/modules/orders/orders.routes.ts
import { Router } from 'express';

import { asyncHandler } from '../../middlewares/async-handler.js';
import { requireAuth, requireRole } from '../../middlewares/auth-context.js';

import { ordersController } from './orders.controller.js';

const SALES = ['SALES_REP', 'SALES_MANAGER', 'ADMIN', 'OWNER'] as const;

export function ordersRouter(): Router {
  const router = Router();
  router.use(requireAuth());

  // Leitura: qualquer role autenticado (ABAC filtra no service).
  router.get('/', asyncHandler(ordersController.list));
  router.get('/:id', asyncHandler(ordersController.getById));

  // Mutações: roles de vendas.
  router.post('/', requireRole(...SALES), asyncHandler(ordersController.create));
  router.patch('/:id', requireRole(...SALES), asyncHandler(ordersController.update));
  router.delete('/:id', requireRole(...SALES), asyncHandler(ordersController.remove));

  router.post('/:id/lines', requireRole(...SALES), asyncHandler(ordersController.addLine));
  router.patch(
    '/:id/lines/:lineId',
    requireRole(...SALES),
    asyncHandler(ordersController.updateLine),
  );
  router.delete(
    '/:id/lines/:lineId',
    requireRole(...SALES),
    asyncHandler(ordersController.deleteLine),
  );

  return router;
}
