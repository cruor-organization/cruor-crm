// backend/src/modules/quotes/quotes.service.test.ts
import { describe, expect, it } from 'vitest';

import { ConflictError } from '../../shared/errors.js';

import { assertQuoteDraft } from './quotes.service.js';

describe('assertQuoteDraft (gating)', () => {
  it('permite DRAFT', () => {
    expect(() => assertQuoteDraft({ status: 'DRAFT' })).not.toThrow();
  });

  it('rejeita qualquer outro estado', () => {
    expect(() => assertQuoteDraft({ status: 'SENT' })).toThrowError(ConflictError);
    expect(() => assertQuoteDraft({ status: 'ACCEPTED' })).toThrowError(ConflictError);
  });
});
