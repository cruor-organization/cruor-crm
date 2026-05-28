import { Router } from 'express';

import { asyncHandler } from '../../middlewares/async-handler.js';
import { requireAuth, requireRole } from '../../middlewares/auth-context.js';

import { auditController } from './audit.controller.js';

export function auditRouter(): Router {
  const router = Router();
  router.use(requireAuth());

  router.get('/', requireRole('SALES_MANAGER', 'ADMIN'), asyncHandler(auditController.list));

  return router;
}
