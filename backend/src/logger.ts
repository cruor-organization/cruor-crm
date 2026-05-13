/**
 * Pino logger central com PII redact (§9 / Hard Invariants do CLAUDE.md).
 */
import pino, { type Logger } from 'pino';

import type { Env } from './config/env.js';

export function createLogger(env: Env): Logger {
  return pino({
    level: env.LOG_LEVEL,
    redact: {
      paths: [
        'req.headers.authorization',
        'req.headers.cookie',
        'res.headers["set-cookie"]',
        '*.password',
        '*.email',
        '*.taxId',
        '*.nif',
        '*.phone',
        '*.phonePrimary',
        '*.whatsappNumber',
        '*.address',
        '*.addresses',
        '*.contacts',
      ],
      remove: false,
      censor: '[REDACTED]',
    },
    ...(env.NODE_ENV === 'development'
      ? { transport: { target: 'pino-pretty', options: { translateTime: 'SYS:HH:MM:ss' } } }
      : {}),
  });
}
