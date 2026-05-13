import { describe, expect, it } from 'vitest';

import { scoreLead } from './lead-scoring.js';

describe('scoreLead', () => {
  it('atelier de eventos premium maximiza score', () => {
    const s = scoreLead({
      businessType: 'EVENT_ATELIER',
      estimatedMonthlyVolumeEur: 5000,
      instagramFollowers: 20000,
      shopSizeSqm: 120,
      geoZone: 'PT-LISBOA',
      source: 'REFERRAL',
    });
    // 25 + 20 + 10 + 10 + 5 + 20 = 90
    expect(s).toBe(90);
  });

  it('lead frio sem dados pontua zero', () => {
    expect(scoreLead({})).toBe(0);
  });

  it('clamp em 100', () => {
    const s = scoreLead({
      businessType: 'EVENT_ATELIER',
      estimatedMonthlyVolumeEur: 100_000,
      instagramFollowers: 1_000_000,
      shopSizeSqm: 999,
      geoZone: 'PT-LISBOA',
      source: 'REFERRAL',
      primeZones: ['PT-LISBOA'],
    });
    expect(s).toBeLessThanOrEqual(100);
  });

  it('source REFERRAL adiciona 20 mesmo sem businessType', () => {
    expect(scoreLead({ source: 'REFERRAL' })).toBe(20);
  });
});
