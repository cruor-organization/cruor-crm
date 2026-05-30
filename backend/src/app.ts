/**
 * Construção da Express app. Isolada do bootstrap (src/index.ts) para
 * facilitar testes Supertest (cria a app sem `listen`).
 */
import { toNodeHandler } from 'better-auth/node';
import compression from 'compression';
import cors from 'cors';
import express, { type Express } from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import hpp from 'hpp';
import { pinoHttp } from 'pino-http';

import { createAuth, type Auth } from './auth/index.js';
import type { Env } from './config/env.js';
import { createLogger } from './logger.js';
import { attachAuthContext } from './middlewares/auth-context.js';
import { errorHandler } from './middlewares/error.js';
import { requestId, REQUEST_ID_HEADER } from './middlewares/request-id.js';
import { auditRouter } from './modules/audit/audit.routes.js';
import { customersRouter } from './modules/customers/customers.routes.js';
import { leadsRouter } from './modules/leads/leads.routes.js';
import { ordersRouter } from './modules/orders/orders.routes.js';
import { pricingRouter } from './modules/pricing/pricing.routes.js';
import { productsRouter } from './modules/products/products.routes.js';
import { stockRouter } from './modules/stock/stock.routes.js';
import { suppliersRouter } from './modules/suppliers/suppliers.routes.js';
import { healthRouter } from './routes/health.js';
import { meRouter } from './routes/me.js';

export interface CreatedApp {
  app: Express;
  auth: Auth;
}

export function createApp(env: Env): CreatedApp {
  const app = express();
  const logger = createLogger(env);

  app.disable('x-powered-by');
  app.set('trust proxy', 1);

  app.use(requestId());
  app.use(
    pinoHttp({
      logger,
      genReqId: (req) => req.headers[REQUEST_ID_HEADER] as string,
    }),
  );

  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          frameAncestors: ["'none'"],
        },
      },
      crossOriginEmbedderPolicy: false,
    }),
  );
  app.use(
    cors({
      origin: [env.FRONTEND_URL],
      credentials: true,
    }),
  );
  app.use(hpp());
  app.use(compression());

  // Auth handler montado antes do JSON body parser (Better Auth lê o stream).
  const auth = createAuth({
    betterAuthSecret: env.BETTER_AUTH_SECRET,
    betterAuthUrl: env.BETTER_AUTH_URL,
    frontendUrl: env.FRONTEND_URL,
  });

  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 5,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    // `req.path` is mount-relative inside `app.use('/api/auth', ...)`, so it omits the prefix.
    skip: (req) => req.method === 'GET' && req.path.startsWith('/get-session'),
  });
  app.use('/api/auth', authLimiter, toNodeHandler(auth));

  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: false, limit: '1mb' }));

  // AuthContext após o body parser; popula `req.ctx`.
  app.use(attachAuthContext(auth));

  app.use(healthRouter());
  app.use(meRouter(auth));
  app.use('/api/suppliers', suppliersRouter());
  app.use('/api/customers', customersRouter());
  app.use('/api/leads', leadsRouter());
  app.use('/api/orders', ordersRouter());
  app.use('/api/products', productsRouter());
  app.use('/api/stock', stockRouter());
  app.use('/api/pricing', pricingRouter());
  app.use('/api/audit', auditRouter());

  app.use((_req, res) => {
    res.status(404).json({ code: 'NOT_FOUND', message: 'Rota não encontrada.' });
  });
  app.use(errorHandler());

  return { app, auth };
}
