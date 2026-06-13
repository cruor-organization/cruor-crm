/**
 * Validação fail-fast da env (§2.6).
 * Faz pick dos valores relevantes antes de validar — process.env tem ~200 vars
 * do shell, não é boundary input para .strict() literal.
 */
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(3001),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),

  DATABASE_URL: z.string().url(),

  BETTER_AUTH_SECRET: z.string().min(32, 'BETTER_AUTH_SECRET tem de ter pelo menos 32 caracteres.'),
  BETTER_AUTH_URL: z.string().url(),
  FRONTEND_URL: z.string().url(),

  // Sync Alibaba → stock (§10.12). `mock` usa fixture local (a API real bloqueia
  // bots — §883); `live` exige o adapter configurado.
  ALIBABA_API_MODE: z.enum(['mock', 'live']).default('mock'),
  // Poller em background (setInterval). Desligado por defeito; o sync também é
  // disparável manualmente via POST /api/alibaba/sync.
  ALIBABA_SYNC_ENABLED: z
    .enum(['true', 'false'])
    .default('false')
    .transform((v) => v === 'true'),
  ALIBABA_SYNC_INTERVAL_MS: z.coerce.number().int().min(30000).default(300000),

  // Provider de faturação (§10.14). mock por defeito; real (Moloni/InvoiceXpress)
  // é decisão da Fase 4.
  INVOICE_PROVIDER: z.enum(['mock', 'moloni', 'invoicexpress']).default('mock'),

  // AI service (Fase 4, §10.8). O backend chama o ai-service para embeddings e
  // chat; o ai-service chama de volta /internal/tools/* — HMAC bidirecional com
  // segredo partilhado (tem de ser igual ao AI_HMAC_SECRET do ai-service).
  AI_SERVICE_URL: z.string().url().default('http://localhost:3002'),
  AI_HMAC_SECRET: z.string().min(32, 'AI_HMAC_SECRET tem de ter pelo menos 32 caracteres.'),
});

export type Env = z.infer<typeof envSchema>;

const RELEVANT_KEYS = [
  'NODE_ENV',
  'PORT',
  'LOG_LEVEL',
  'DATABASE_URL',
  'BETTER_AUTH_SECRET',
  'BETTER_AUTH_URL',
  'FRONTEND_URL',
  'ALIBABA_API_MODE',
  'ALIBABA_SYNC_ENABLED',
  'ALIBABA_SYNC_INTERVAL_MS',
  'INVOICE_PROVIDER',
  'AI_SERVICE_URL',
  'AI_HMAC_SECRET',
] as const;

export function loadEnv(input: NodeJS.ProcessEnv = process.env): Env {
  const picked: Record<string, string | undefined> = {};
  for (const key of RELEVANT_KEYS) picked[key] = input[key];

  const result = envSchema.safeParse(picked);
  if (!result.success) {
    const issues = result.error.issues
      .map((i) => `  - ${i.path.join('.')}: ${i.message}`)
      .join('\n');
    throw new Error(`Configuração de ambiente inválida:\n${issues}`);
  }
  return result.data;
}
