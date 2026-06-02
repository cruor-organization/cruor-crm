// backend/src/domain/returns/return-number.test.ts
import { describe, expect, it } from 'vitest';

import { buildReturnNumber } from './return-number.js';

describe('buildReturnNumber', () => {
  it('formata DEV-{ano}-{seq} com padding a 4', () => {
    expect(buildReturnNumber(2026, 1)).toBe('DEV-2026-0001');
    expect(buildReturnNumber(2026, 42)).toBe('DEV-2026-0042');
    expect(buildReturnNumber(2026, 1234)).toBe('DEV-2026-1234');
  });

  it('não trunca sequências acima de 4 dígitos', () => {
    expect(buildReturnNumber(2026, 12345)).toBe('DEV-2026-12345');
  });
});
