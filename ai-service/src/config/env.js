import { z } from 'zod';
const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    AI_SERVICE_PORT: z.coerce.number().int().min(1).max(65535).default(3002),
    LOG_LEVEL: z
      .enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'])
      .default('info'),
    BACKEND_HMAC_SECRET: z
      .string()
      .min(32, 'BACKEND_HMAC_SECRET tem de ter pelo menos 32 caracteres.'),
  })
  .strict();
export function loadAiEnv(input = process.env) {
  const result = envSchema.safeParse(input);
  if (!result.success) {
    const issues = result.error.issues
      .map((i) => `  - ${i.path.join('.')}: ${i.message}`)
      .join('\n');
    throw new Error(`Configuração de ambiente inválida:\n${issues}`);
  }
  return result.data;
}
//# sourceMappingURL=env.js.map
