// backend/src/modules/alibaba/alibaba.routes.ts
import { Router } from 'express';

import { asyncHandler } from '../../middlewares/async-handler.js';
import { requireAuth, requireRole } from '../../middlewares/auth-context.js';

import type { AlibabaApiPort } from './alibaba-api.port.js';
import { makeAlibabaController } from './alibaba.controller.js';

export function alibabaRouter(api: AlibabaApiPort): Router {
  const router = Router();
  const controller = makeAlibabaController(api);
  router.use(requireAuth());

  router.get('/orders', asyncHandler(controller.list));
  router.get('/orders/:id', asyncHandler(controller.getById));

  // Dispara o sync manualmente. OWNER herda ADMIN/WAREHOUSE.
  router.post('/sync', requireRole('ADMIN', 'WAREHOUSE'), asyncHandler(controller.sync));

  return router;
}
