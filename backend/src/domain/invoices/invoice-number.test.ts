// backend/src/domain/invoices/invoice-number.test.ts
import { describe, expect, it } from 'vitest';

import { buildInvoiceNumber } from './invoice-number.js';

describe('buildInvoiceNumber', () => {
  it('formata FT-AAAA-NNNN com zero-pad a 4', () => {
    expect(buildInvoiceNumber(2026, 1)).toBe('FT-2026-0001');
    expect(buildInvoiceNumber(2026, 1234)).toBe('FT-2026-1234');
  });
});
