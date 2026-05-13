import { Router } from 'express';

import { prisma } from '../db/index.js';

export function healthRouter(): Router {
  const router = Router();

  router.get('/healthz', (_req, res) => {
    res.json({ status: 'ok', service: 'backend' });
  });

  router.get('/readyz', async (_req, res) => {
    try {
      await prisma.$queryRaw`SELECT 1`;
      res.json({ status: 'ok', checks: { db: 'ok' } });
    } catch (err) {
      res.status(503).json({
        status: 'error',
        checks: { db: 'fail' },
        message: err instanceof Error ? err.message : 'unknown',
      });
    }
  });

  return router;
}
