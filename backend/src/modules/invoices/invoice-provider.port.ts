// backend/src/modules/invoices/invoice-provider.port.ts
//
// Porta para o provider de faturação certificada + impl mock e stub live.
// O número fiscal local (FT-AAAA-NNNN) é atribuído pelo serviço; o provider
// devolve a sua própria referência (externalId) e payload bruto. Na Fase 4 o
// provider real (Moloni/InvoiceXpress) substitui o mock.
import { IntegrationError } from '../../shared/errors.js';

export interface IssueInvoiceInput {
  invoiceId: string;
  number: string;
  totalEur: number;
  currency: string;
}

export interface InvoiceProviderPort {
  readonly name: string;
  issue(input: IssueInvoiceInput): Promise<{ externalId: string; raw: unknown }>;
}

class MockInvoiceProvider implements InvoiceProviderPort {
  readonly name = 'mock';
  issue(input: IssueInvoiceInput): Promise<{ externalId: string; raw: unknown }> {
    return Promise.resolve({
      externalId: `mock-${input.invoiceId}`,
      raw: { provider: 'mock', number: input.number, totalEur: input.totalEur },
    });
  }
}

class LiveInvoiceProvider implements InvoiceProviderPort {
  constructor(readonly name: string) {}
  issue(): Promise<{ externalId: string; raw: unknown }> {
    // TODO(invoices): integração real Moloni/InvoiceXpress (emissão certificada AT) — Fase 4.
    throw new IntegrationError(
      'INVOICE_PROVIDER_NOT_CONFIGURED',
      `Provider de faturação "${this.name}" ainda não está integrado.`,
    );
  }
}

export function createInvoiceProvider(
  provider: 'mock' | 'moloni' | 'invoicexpress',
): InvoiceProviderPort {
  return provider === 'mock' ? new MockInvoiceProvider() : new LiveInvoiceProvider(provider);
}
