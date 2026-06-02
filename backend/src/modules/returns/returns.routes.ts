// backend/src/modules/returns/returns.routes.ts
import { Router } from 'express';

import { asyncHandler } from '../../middlewares/async-handler.js';
import { requireAuth, requireRole } from '../../middlewares/auth-context.js';

import { returnsController } from './returns.controller.js';

const SALES = ['SALES_REP', 'SALES_MANAGER', 'ADMIN', 'OWNER'] as const;
// Receção/decisão física: também o armazém (espelha STATUS_ROLES das encomendas).
const PROCESS_ROLES = [...SALES, 'WAREHOUSE'] as const;

export function returnsRouter(): Router {
  const router = Router();
  router.use(requireAuth());

  // Leitura: qualquer role autenticado (ABAC filtra no service).
  router.get('/', asyncHandler(returnsController.list));
  router.get('/:id', asyncHandler(returnsController.getById));

  // Abertura: roles de vendas.
  router.post('/', requireRole(...SALES), asyncHandler(returnsController.create));

  // Receção em quarentena + decisão (restock/scrap): vendas ou armazém.
  router.post('/:id/receive', requireRole(...PROCESS_ROLES), asyncHandler(returnsController.receive));
  router.post('/:id/decide', requireRole(...PROCESS_ROLES), asyncHandler(returnsController.decide));

  return router;
}
