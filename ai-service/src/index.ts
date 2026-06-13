/**
 * AI Service (Fase 4, §10.8) — plano de computação de IA stateless.
 * Único sítio com OPENAI_API_KEY. Não toca na DB (ADR-0002): as tools de domínio
 * batem de volta no backend via HMAC. Providers mock|live selecionados por env.
 */
import express from 'express';
import pino from 'pino';
import { pinoHttp } from 'pino-http';

import { makeBackendToolsClient } from './clients/backend-tools.client.js';
import { loadAiEnv } from './config/env.js';
import { requireHmac } from './middlewares/hmac.js';
import { createAiProviders } from './providers/index.js';
import { chatRouter } from './routes/chat.js';
import { embedRouter } from './routes/embed.js';

function main(): void {
  const env = loadAiEnv();
  const logger = pino({
    level: env.LOG_LEVEL,
    // PII masking (§9): nunca logar headers de assinatura nem corpos com dados de cliente.
    redact: ['req.headers["x-ai-signature"]', 'req.headers.authorization'],
    ...(env.NODE_ENV === 'development'
      ? { transport: { target: 'pino-pretty', options: { translateTime: 'SYS:HH:MM:ss' } } }
      : {}),
  });

  const providers = createAiProviders(env);
  const toolsClient = makeBackendToolsClient(env.BACKEND_URL, env.AI_HMAC_SECRET);

  const app = express();
  app.disable('x-powered-by');
  app.use(pinoHttp({ logger }));

  // Captura o body raw para verificação HMAC (a assinatura cobre os bytes exatos).
  app.use(
    express.json({
      limit: '1mb',
      verify: (req, _res, buf) => {
        (req as express.Request).rawBody = buf.toString('utf8');
      },
    }),
  );

  app.get('/healthz', (_req, res) => {
    res.json({ status: 'ok', service: 'ai-service', phase: 'phase-4-slice-1' });
  });

  app.get('/readyz', (_req, res) => {
    res.json({ status: 'ok', checks: { provider: providers.mode } });
  });

  // Rotas internas protegidas por HMAC (nunca expostas publicamente).
  app.use(requireHmac(env.AI_HMAC_SECRET), embedRouter(providers), chatRouter(providers, toolsClient));

  app.listen(env.AI_SERVICE_PORT, () => {
    logger.info({ port: env.AI_SERVICE_PORT, provider: providers.mode }, '[ai-service] up');
  });
}

main();
