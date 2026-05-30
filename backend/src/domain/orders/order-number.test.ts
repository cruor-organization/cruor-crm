import { describe, expect, it } from 'vitest';

import { buildOrderNumber } from './order-number.js';

describe('buildOrderNumber', () => {
  it('formata com padding a 4 dígitos', () => {
    expect(buildOrderNumber(2026, 1)).toBe('ENC-2026-0001');
  });

  it('não trunca seq com 4+ dígitos', () => {
    expect(buildOrderNumber(2026, 1234)).toBe('ENC-2026-1234');
    expect(buildOrderNumber(2026, 12345)).toBe('ENC-2026-12345');
  });
});
