/**
 * AI Service — stub para Fase 0.
 * LangChain JS + LangGraph JS + pgvector + RAG entram em Fase 4 (§15).
 * Por agora apenas health + boot.
 */
import express from 'express';
import pino from 'pino';
import { pinoHttp } from 'pino-http';
import { loadAiEnv } from './config/env.js';
function main() {
  const env = loadAiEnv();
  const logger = pino({
    level: env.LOG_LEVEL,
    ...(env.NODE_ENV === 'development'
      ? { transport: { target: 'pino-pretty', options: { translateTime: 'SYS:HH:MM:ss' } } }
      : {}),
  });
  const app = express();
  app.disable('x-powered-by');
  app.use(pinoHttp({ logger }));
  app.get('/healthz', (_req, res) => {
    res.json({ status: 'ok', service: 'ai-service', phase: 'stub-phase-0' });
  });
  app.get('/readyz', (_req, res) => {
    res.json({ status: 'ok', checks: {} });
  });
  app.listen(env.AI_SERVICE_PORT, () => {
    logger.info({ port: env.AI_SERVICE_PORT }, '[ai-service] up');
  });
}
main();
//# sourceMappingURL=index.js.map
