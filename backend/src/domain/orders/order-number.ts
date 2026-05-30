/** Número legível de encomenda: ENC-{ano}-{seq zero-padded a 4}. */
export function buildOrderNumber(year: number, seq: number): string {
  return `ENC-${year}-${String(seq).padStart(4, '0')}`;
}
