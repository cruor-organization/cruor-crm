// backend/src/domain/quotes/quote-number.test.ts
import { describe, expect, it } from 'vitest';

import { buildQuoteNumber } from './quote-number.js';

describe('buildQuoteNumber', () => {
  it('formata ORC-{ano}-{seq} com padding a 4', () => {
    expect(buildQuoteNumber(2026, 1)).toBe('ORC-2026-0001');
    expect(buildQuoteNumber(2026, 73)).toBe('ORC-2026-0073');
  });

  it('não trunca sequências acima de 4 dígitos', () => {
    expect(buildQuoteNumber(2026, 12345)).toBe('ORC-2026-12345');
  });
});
