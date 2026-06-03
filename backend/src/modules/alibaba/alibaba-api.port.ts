// backend/src/modules/alibaba/alibaba-api.port.ts
//
// Porta (interface) para a API de encomendas da Alibaba + duas implementações:
//   - mock: fixture determinista (default). A API real bloqueia bots (§883), por
//     isso o desenvolvimento/validação corre sobre dados simulados.
//   - live: stub que falha explicitamente até existir integração real.
//
// AMEAÇAS (§3.1): o payload remoto é input não confiável. O serviço NUNCA confia
// em `variantId`/preços do remoto — resolve SKUs contra a DB da org e ignora o que
// não casar. Aqui só definimos o contrato de transporte.

import type { AlibabaStatus } from '../../domain/alibaba/sync.js';
import { IntegrationError } from '../../shared/errors.js';

export interface RemoteAlibabaItem {
  /** SKU da variante — resolvido contra product_variant da org no serviço. */
  sku: string;
  qty: number;
  unitCostEur?: number;
  batch?: string;
}

export interface RemoteAlibabaOrder {
  /** ID na Alibaba — chave de idempotência (upsert por organizationId+externalId). */
  externalId: string;
  status: AlibabaStatus;
  currency?: string;
  /** ISO 8601. */
  placedAt?: string;
  expectedArrival?: string;
  deliveredAt?: string;
  items: RemoteAlibabaItem[];
}

export interface AlibabaApiPort {
  listOrders(input: { since: Date | null }): Promise<RemoteAlibabaOrder[]>;
}

/**
 * Fixture determinista para `mock`. Inclui uma encomenda DELIVERED (deve gerar
 * StockMovement IN no 1º sync e nada nos seguintes) e uma SHIPPED (ainda sem stock).
 * Os SKUs têm de existir em product_variant da org para o IN ser aplicado; caso
 * contrário o serviço regista um erro por item e segue (não rebenta).
 */
const MOCK_ORDERS: RemoteAlibabaOrder[] = [
  {
    externalId: 'ALI-MOCK-0001',
    status: 'DELIVERED',
    currency: 'USD',
    placedAt: '2026-05-01T08:00:00.000Z',
    expectedArrival: '2026-05-28T00:00:00.000Z',
    deliveredAt: '2026-05-27T14:30:00.000Z',
    items: [
      { sku: 'MOCK-SKU-1', qty: 120, unitCostEur: 1.4, batch: 'LOTE-2605' },
      { sku: 'MOCK-SKU-2', qty: 60, unitCostEur: 2.1 },
    ],
  },
  {
    externalId: 'ALI-MOCK-0002',
    status: 'SHIPPED',
    currency: 'USD',
    placedAt: '2026-05-20T08:00:00.000Z',
    expectedArrival: '2026-06-15T00:00:00.000Z',
    items: [{ sku: 'MOCK-SKU-1', qty: 200, unitCostEur: 1.35 }],
  },
];

class MockAlibabaApi implements AlibabaApiPort {
  listOrders(): Promise<RemoteAlibabaOrder[]> {
    // Estável entre chamadas: a idempotência do sync é provada pela guarda
    // stockAppliedAt, não por o mock mudar de resposta.
    return Promise.resolve(MOCK_ORDERS);
  }
}

class LiveAlibabaApi implements AlibabaApiPort {
  listOrders(): Promise<RemoteAlibabaOrder[]> {
    // TODO(alibaba): integração real (Apify Actor ou import manual — §883).
    throw new IntegrationError(
      'ALIBABA_API_NOT_CONFIGURED',
      'Modo live ainda não tem integração com a API da Alibaba.',
    );
  }
}

export function createAlibabaApi(mode: 'mock' | 'live'): AlibabaApiPort {
  return mode === 'live' ? new LiveAlibabaApi() : new MockAlibabaApi();
}
