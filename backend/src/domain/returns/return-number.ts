/** Número legível de devolução: DEV-{ano}-{seq zero-padded a 4}. */
export function buildReturnNumber(year: number, seq: number): string {
  return `DEV-${year}-${String(seq).padStart(4, '0')}`;
}
