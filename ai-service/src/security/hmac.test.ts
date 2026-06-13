import { describe, expect, it } from 'vitest';

import { sign, signedHeaders, verify } from './hmac.js';

const SECRET = 'x'.repeat(40);

describe('hmac', () => {
  it('verifica uma assinatura válida', () => {
    const ts = '1000000';
    const body = '{"a":1}';
    const sig = sign(SECRET, ts, body);
    expect(verify(SECRET, ts, sig, body, 1000000).ok).toBe(true);
  });

  it('rejeita assinatura errada', () => {
    const r = verify(SECRET, '1000000', 'deadbeef', '{"a":1}', 1000000);
    expect(r.ok).toBe(false);
    expect(r.reason).toBe('BAD_SIGNATURE');
  });

  it('rejeita headers em falta', () => {
    expect(verify(SECRET, undefined, undefined, '{}').reason).toBe('MISSING_HEADERS');
  });

  it('rejeita timestamp fora da janela de replay', () => {
    const ts = '1000000';
    const body = '{}';
    const sig = sign(SECRET, ts, body);
    // 10 min depois — fora da janela de 5 min.
    expect(verify(SECRET, ts, sig, body, 1000000 + 10 * 60 * 1000).reason).toBe('STALE');
  });

  it('signedHeaders produz assinatura verificável', () => {
    const body = '{"x":42}';
    const now = 1234567890;
    const h = signedHeaders(SECRET, body, now);
    expect(verify(SECRET, h['x-ai-timestamp'], h['x-ai-signature'], body, now).ok).toBe(true);
  });
});
