import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  AI_SERVICE_PORT: z.coerce.number().int().min(1).max(65535).default(3002),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),

  // Segredo HMAC partilhado com o backend (igual ao AI_HMAC_SECRET do backend).
  // Protege /embed e /chat/stream (backend→ai-service) e as tools (ai-service→backend).
  AI_HMAC_SECRET: z.string().min(32, 'AI_HMAC_SECRET tem de ter pelo menos 32 caracteres.'),

  // URL do backend para as tools de domínio do agente (HMAC).
  BACKEND_URL: z.string().url().default('http://localhost:3001'),

  // Provider de IA (§10.8). `mock` = determinístico, sem API keys nem custo (CI/E2E).
  // `live` = OpenAI real (exige OPENAI_API_KEY). Espelha o padrão invoice/alibaba.
  AI_PROVIDER: z.enum(['mock', 'live']).default('mock'),
  OPENAI_API_KEY: z.string().min(1).optional(),
  // §0 desvia para OpenAI no chatbot (decisão Fase 4, ADR-0003). gpt-4o por defeito.
  OPENAI_CHAT_MODEL: z.string().min(1).default('gpt-4o'),
  // §0: embeddings text-embedding-3-small (1536 dims) — sem desvio.
  OPENAI_EMBEDDING_MODEL: z.string().min(1).default('text-embedding-3-small'),
});

export type AiEnv = z.infer<typeof envSchema>;

const RELEVANT_KEYS = [
  'NODE_ENV',
  'AI_SERVICE_PORT',
  'LOG_LEVEL',
  'AI_HMAC_SECRET',
  'BACKEND_URL',
  'AI_PROVIDER',
  'OPENAI_API_KEY',
  'OPENAI_CHAT_MODEL',
  'OPENAI_EMBEDDING_MODEL',
] as const;

export function loadAiEnv(input: NodeJS.ProcessEnv = process.env): AiEnv {
  const picked: Record<string, string | undefined> = {};
  for (const key of RELEVANT_KEYS) picked[key] = input[key];

  const result = envSchema.safeParse(picked);
  if (!result.success) {
    const issues = result.error.issues
      .map((i) => `  - ${i.path.join('.')}: ${i.message}`)
      .join('\n');
    throw new Error(`Configuração de ambiente inválida:\n${issues}`);
  }
  // `live` exige OPENAI_API_KEY — falha cedo e claro.
  if (result.data.AI_PROVIDER === 'live' && !result.data.OPENAI_API_KEY) {
    throw new Error('Configuração de ambiente inválida:\n  - OPENAI_API_KEY: obrigatório quando AI_PROVIDER=live.');
  }
  return result.data;
}
