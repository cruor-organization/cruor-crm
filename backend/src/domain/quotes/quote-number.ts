/** Número legível de proposta: ORC-{ano}-{seq zero-padded a 4}. */
export function buildQuoteNumber(year: number, seq: number): string {
  return `ORC-${year}-${String(seq).padStart(4, '0')}`;
}
