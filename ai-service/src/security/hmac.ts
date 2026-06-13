/**
 * HMAC partilhado backend ↔ ai-service (§9 webhooks: assinatura + idempotência;
 * aqui replay-window em vez de eventId porque não há evento persistido).
 *
 * Convenção: assina `${timestamp}.${rawBody}` com HMAC-SHA256, hex.
 * Headers: `x-ai-timestamp` (epoch ms), `x-ai-signature` (hex).
 * Duplicado no backend (ADR-0002: sem package partilhado).
 */
import { createHmac, timingSafeEqual } from 'node:crypto';

const REPLAY_WINDOW_MS = 5 * 60 * 1000;

export function sign(secret: string, timestamp: string, rawBody: string): string {
  return createHmac('sha256', secret).update(`${timestamp}.${rawBody}`).digest('hex');
}

export interface VerifyResult {
  ok: boolean;
  reason?: 'MISSING_HEADERS' | 'STALE' | 'BAD_SIGNATURE';
}

export function verify(
  secret: string,
  timestamp: string | undefined,
  signature: string | undefined,
  rawBody: string,
  now: number = Date.now(),
): VerifyResult {
  if (!timestamp || !signature) return { ok: false, reason: 'MISSING_HEADERS' };

  const ts = Number(timestamp);
  if (!Number.isFinite(ts) || Math.abs(now - ts) > REPLAY_WINDOW_MS) {
    return { ok: false, reason: 'STALE' };
  }

  const expected = sign(secret, timestamp, rawBody);
  const a = Buffer.from(expected, 'hex');
  const b = Buffer.from(signature, 'hex');
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    return { ok: false, reason: 'BAD_SIGNATURE' };
  }
  return { ok: true };
}

/** Cabeçalhos assinados para chamadas de saída (ai-service → backend). */
export function signedHeaders(secret: string, rawBody: string, now: number = Date.now()): Record<string, string> {
  const timestamp = String(now);
  return {
    'content-type': 'application/json',
    'x-ai-timestamp': timestamp,
    'x-ai-signature': sign(secret, timestamp, rawBody),
  };
}
