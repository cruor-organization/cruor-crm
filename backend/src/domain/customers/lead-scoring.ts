/**
 * Score de florista-potencial (§10.3 few-shot 2).
 * Sinais específicos do setor; range [0, 100].
 */

export type LeadBusinessType =
  | 'PHYSICAL_SHOP'
  | 'EVENT_ATELIER'
  | 'DECORATOR'
  | 'HOTEL_RESTAURANT'
  | 'ONLINE_ONLY'
  | 'MIXED';

export type LeadSource =
  | 'REFERRAL'
  | 'WEBSITE'
  | 'INSTAGRAM'
  | 'COLD_OUTREACH'
  | 'EVENT_FAIR'
  | 'GOOGLE_PLACES'
  | 'OTHER';

export interface LeadScoringInput {
  businessType?: LeadBusinessType | null;
  estimatedMonthlyVolumeEur?: number | null;
  instagramFollowers?: number | null;
  shopSizeSqm?: number | null;
  geoZone?: string | null;
  /** Zonas comerciais "prime" do mercado ibérico. */
  primeZones?: readonly string[];
  source?: LeadSource | null;
}

const BUSINESS_TYPE_POINTS: Record<LeadBusinessType, number> = {
  EVENT_ATELIER: 25,
  DECORATOR: 20,
  HOTEL_RESTAURANT: 20,
  PHYSICAL_SHOP: 15,
  ONLINE_ONLY: 10,
  MIXED: 15,
};

const DEFAULT_PRIME_ZONES: readonly string[] = [
  'PT-LISBOA',
  'PT-PORTO',
  'PT-CASCAIS',
  'ES-MADRID',
  'ES-BARCELONA',
  'ES-VALENCIA',
];

export function scoreLead(input: LeadScoringInput): number {
  let score = 0;

  if (input.businessType) {
    score += BUSINESS_TYPE_POINTS[input.businessType];
  }
  if ((input.estimatedMonthlyVolumeEur ?? 0) >= 1000) score += 20;
  if ((input.instagramFollowers ?? 0) >= 5000) score += 10;
  if ((input.shopSizeSqm ?? 0) >= 50) score += 10;

  const zones = input.primeZones ?? DEFAULT_PRIME_ZONES;
  if (input.geoZone && zones.includes(input.geoZone)) score += 5;

  if (input.source === 'REFERRAL') score += 20;

  return Math.max(0, Math.min(100, Math.round(score)));
}
