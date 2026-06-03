// backend/src/domain/invoices/invoice-number.ts
/** Número fiscal legível: FT-{ano}-{seq zero-padded a 4}. */
export function buildInvoiceNumber(year: number, seq: number): string {
  return `FT-${year}-${String(seq).padStart(4, '0')}`;
}
