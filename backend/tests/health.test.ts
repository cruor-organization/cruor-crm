import { describe, expect, it, vi } from 'vitest';

vi.mock('../src/db/index.js', () => ({
  prisma: {
    $queryRaw: vi.fn().mockResolvedValue([{ '?column?': 1 }]),
  },
}));

vi.mock('../src/auth/index.js', () => ({
  createAuth: () => ({
    api: { getSession: vi.fn().mockResolvedValue(null) },
    handler: vi.fn(),
  }),
}));

vi.mock('better-auth/node', () => ({
  toNodeHandler: () => (_req: unknown, res: { status: (n: number) => { end: () => void } }) =>
    res.status(204).end(),
  fromNodeHeaders: (h: unknown) => h,
}));

import request from 'supertest';

import { createApp } from '../src/app.js';

const env = {
  NODE_ENV: 'test' as const,
  PORT: 0,
  LOG_LEVEL: 'silent' as const,
  DATABASE_URL: 'postgresql://test:test@localhost:5432/test',
  BETTER_AUTH_SECRET: 'x'.repeat(40),
  BETTER_AUTH_URL: 'http://localhost:3001',
  FRONTEND_URL: 'http://localhost:5173',
  ALIBABA_API_MODE: 'mock' as const,
  ALIBABA_SYNC_ENABLED: false,
  ALIBABA_SYNC_INTERVAL_MS: 300000,
  INVOICE_PROVIDER: 'mock' as const,
};

describe('GET /healthz', () => {
  it('responde 200 ok', async () => {
    const { app } = createApp(env);
    const res = await request(app).get('/healthz');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok', service: 'backend' });
  });
});

describe('GET /readyz', () => {
  it('responde 200 quando DB está acessível', async () => {
    const { app } = createApp(env);
    const res = await request(app).get('/readyz');
    expect(res.status).toBe(200);
    const body = res.body as { status: string; checks: { db: string } };
    expect(body.checks.db).toBe('ok');
  });
});
