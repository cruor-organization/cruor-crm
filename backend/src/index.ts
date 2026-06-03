/**
 * Entry point do backend.
 * §2.6 — fail fast: env é validada antes de criar a app.
 */
import 'dotenv/config';

import { createApp } from './app.js';
import { loadEnv } from './config/env.js';
import { startAlibabaPoller, type PollerHandle } from './modules/alibaba/alibaba-poller.js';

function main(): void {
  const env = loadEnv();
  const { app, alibabaApi } = createApp(env);

  const server = app.listen(env.PORT, () => {
    console.log(`[backend] http://localhost:${String(env.PORT)} (env=${env.NODE_ENV})`);
  });

  let poller: PollerHandle | undefined;
  if (env.ALIBABA_SYNC_ENABLED) {
    poller = startAlibabaPoller({ api: alibabaApi, intervalMs: env.ALIBABA_SYNC_INTERVAL_MS });
    console.log(`[backend] alibaba sync poller ON (${String(env.ALIBABA_SYNC_INTERVAL_MS)}ms)`);
  }

  const shutdown = (signal: string): void => {
    console.log(`[backend] received ${signal}, closing...`);
    poller?.stop();
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(1), 10_000).unref();
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

main();
