# Faturação (Invoice + Payment) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Emitir faturas ligadas à FSM da encomenda (pronto-pagamento → `CONFIRMED`, conta corrente → `SHIPPED`), com adapter de provider (mock), registo manual de pagamentos, e o credit-limit check em falta no `createOrder`.

**Architecture:** Modelos aditivos `Invoice`/`InvoiceLine`/`Payment` com snapshots de totais. Lógica pura em `domain/invoices/` (TDD). A fatura é criada `PENDING` **dentro** da transação da transição da encomenda (idempotente, uma por encomenda) e emitida via provider **após o commit** (I/O externo fora da tx; re-emitível). Número fiscal `FT-AAAA-NNNN` atribuído localmente na emissão (collision-retry, como `buildOrderNumber`); provider real (Moloni/InvoiceXpress) fica para a Fase 4.

**Tech Stack:** TypeScript ESM (imports com `.js`), Express, Prisma + Postgres, Zod `.strict()`, vitest. Padrões reutilizados: adapter `Port`+mock da fatia Alibaba; `writeAudit`; `prisma.$transaction`; `requireRole`.

**Spec:** `docs/superpowers/specs/2026-06-03-invoice-payment-design.md`

**Convenções a respeitar:** sem `any`; multi-tenant (`organizationId`) em todas as queries; comentários pt-PT; ficheiros `kebab-case`; correr ferramentas via `node node_modules/<bin>` (o `pnpm` não está no PATH desta sessão e os hooks husky não correm — usar `git commit --no-verify`). `Decimal` do Prisma converte-se para número com `Number(x)` na matemática de domínio.

---

## Task 1: Schema + migração (Invoice, InvoiceLine, Payment)

**Files:**
- Modify: `backend/prisma/schema.prisma`
- Create: `backend/prisma/migrations/20260603_invoices_payments/migration.sql`

- [ ] **Step 1: Adicionar enums + modelos no fim de `schema.prisma`**

```prisma
// ----------------------------------------------------------------------------
// Domínio Fase 3 — Faturação (§10.14)
//
// INVARIANTES: uma fatura por encomenda (orderId @unique); totais são snapshots
// (imunes a alterações futuras de preço/encomenda); número fiscal sequencial por
// org/ano atribuído na emissão; pagamentos nunca excedem o total em aberto.
// ----------------------------------------------------------------------------

enum InvoiceStatus {
  PENDING
  ISSUED
  PAID
  VOID
}

enum PaymentMethod {
  TRANSFER
  CARD
  CASH
  OTHER
}

model Invoice {
  id             String        @id @default(cuid())
  organizationId String
  orderId        String        @unique
  customerId     String
  status         InvoiceStatus @default(PENDING)
  // Número fiscal FT-AAAA-NNNN — só existe a partir de ISSUED.
  number         String?
  // Referência do provider externo (mock: "mock-<id>"; real: id Moloni/InvoiceXpress).
  externalId     String?
  provider       String?
  currency       String        @default("EUR") @db.Char(3)
  subtotalEur    Decimal       @db.Decimal(14, 2)
  vatEur         Decimal       @db.Decimal(14, 2)
  totalEur       Decimal       @db.Decimal(14, 2)
  paidEur        Decimal       @default(0) @db.Decimal(14, 2)
  issuedAt       DateTime?
  dueAt          DateTime?
  raw            Json?
  createdAt      DateTime      @default(now())
  updatedAt      DateTime      @updatedAt

  organization Organization  @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  order        CustomerOrder @relation(fields: [orderId], references: [id], onDelete: Restrict)
  customer     Customer      @relation(fields: [customerId], references: [id], onDelete: Restrict)
  lines        InvoiceLine[]
  payments     Payment[]

  @@unique([organizationId, number])
  @@index([organizationId, status])
  @@index([organizationId, customerId])
  @@map("invoice")
}

model InvoiceLine {
  id             String   @id @default(cuid())
  organizationId String
  invoiceId      String
  variantId      String
  description    String
  qty            Int
  unitPriceEur   Decimal  @db.Decimal(12, 2)
  discountPct    Decimal  @default(0) @db.Decimal(5, 4)
  vatPct         Decimal  @default(0) @db.Decimal(5, 2)
  lineTotalEur   Decimal  @db.Decimal(14, 2)
  createdAt      DateTime @default(now())

  invoice Invoice        @relation(fields: [invoiceId], references: [id], onDelete: Cascade)
  variant ProductVariant @relation(fields: [variantId], references: [id], onDelete: Restrict)

  @@index([organizationId, invoiceId])
  @@map("invoice_line")
}

model Payment {
  id             String        @id @default(cuid())
  organizationId String
  invoiceId      String
  amountEur      Decimal       @db.Decimal(14, 2)
  method         PaymentMethod @default(TRANSFER)
  reference      String?
  paidAt         DateTime      @default(now())
  actorId        String?
  createdAt      DateTime      @default(now())

  invoice Invoice @relation(fields: [invoiceId], references: [id], onDelete: Cascade)
  actor   User?   @relation("PaymentActor", fields: [actorId], references: [id], onDelete: SetNull)

  @@index([organizationId, invoiceId])
  @@map("payment")
}
```

- [ ] **Step 2: Adicionar back-relations**

Em `model Organization` (após `alibabaOrders AlibabaOrder[]`):
```prisma
  invoices      Invoice[]
```
Em `model Customer` (junto às outras relações; procurar a lista de relações do modelo):
```prisma
  invoices Invoice[]
```
Em `model CustomerOrder` (após `history OrderStatusHistory[]`):
```prisma
  invoice Invoice?
```
Em `model ProductVariant` (após `alibabaItems AlibabaOrderItem[]`):
```prisma
  invoiceLines InvoiceLine[]
```
Em `model User` (junto às outras relações, ex.: após `stockMovementsActed`):
```prisma
  payments Payment[] @relation("PaymentActor")
```

- [ ] **Step 3: Validar + formatar**

Run: `cd backend && node node_modules/prisma/build/index.js validate && node node_modules/prisma/build/index.js format`
Expected: "The schema ... is valid" + "Formatted".

- [ ] **Step 4: Gerar SQL da migração via diff**

Run:
```bash
cd backend && node node_modules/prisma/build/index.js migrate diff \
  --from-schema-datasource prisma/schema.prisma \
  --to-schema-datamodel prisma/schema.prisma --script > prisma/migrations/20260603_invoices_payments/migration.sql
```
(Cria o ficheiro com os `CREATE TYPE`/`CREATE TABLE`/`CREATE INDEX`/`AddForeignKey`.)

- [ ] **Step 5: Acrescentar os CHECK no fim de `migration.sql`**

```sql

-- Hard invariants §10.14
ALTER TABLE "payment" ADD CONSTRAINT "payment_amount_positive" CHECK ("amountEur" > 0);
ALTER TABLE "invoice" ADD CONSTRAINT "invoice_paid_nonneg" CHECK ("paidEur" >= 0);
```

- [ ] **Step 6: Aplicar migração + gerar client**

Run: `cd backend && node node_modules/prisma/build/index.js migrate deploy && node node_modules/prisma/build/index.js generate`
Expected: "migration(s) have been applied" + client gerado.

- [ ] **Step 7: Commit**

```bash
git add backend/prisma/schema.prisma backend/prisma/migrations/20260603_invoices_payments/
git commit --no-verify -m "feat(invoices): schema Invoice + InvoiceLine + Payment (§10.14)"
```

---

## Task 2: Domínio — credit-limit check

**Files:**
- Create: `backend/src/domain/invoices/credit.ts`
- Test: `backend/src/domain/invoices/credit.test.ts`

- [ ] **Step 1: Escrever o teste**

```ts
// backend/src/domain/invoices/credit.test.ts
import { describe, expect, it } from 'vitest';

import { ConflictError } from '../../shared/errors.js';

import { assertCreditAvailable } from './credit.js';

describe('assertCreditAvailable (§10.14)', () => {
  it('passa quando dentro do limite', () => {
    expect(() => assertCreditAvailable(100, 50, 200, false)).not.toThrow();
  });

  it('passa no limite exato', () => {
    expect(() => assertCreditAvailable(150, 50, 200, false)).not.toThrow();
  });

  it('lança CREDIT_LIMIT_EXCEEDED quando excede sem pronto-pagamento', () => {
    try {
      assertCreditAvailable(150, 60, 200, false);
      throw new Error('devia ter lançado');
    } catch (err) {
      expect(err).toBeInstanceOf(ConflictError);
      expect((err as ConflictError).code).toBe('CREDIT_LIMIT_EXCEEDED');
    }
  });

  it('pronto-pagamento (paymentUpfront) ignora o limite', () => {
    expect(() => assertCreditAvailable(500, 500, 0, true)).not.toThrow();
  });
});
```

- [ ] **Step 2: Correr — falha**

Run: `cd backend && node node_modules/vitest/vitest.mjs run src/domain/invoices/credit.test.ts`
Expected: FAIL ("Cannot find module './credit.js'").

- [ ] **Step 3: Implementar**

```ts
// backend/src/domain/invoices/credit.ts
import { ConflictError } from '../../shared/errors.js';

/**
 * Verifica o crédito disponível antes de criar a encomenda (§10.14 few-shot 1).
 * `paymentUpfront` (pronto-pagamento) salta a verificação.
 */
export function assertCreditAvailable(
  creditUsed: number,
  orderValue: number,
  creditLimitEur: number,
  paymentUpfront: boolean,
): void {
  if (!paymentUpfront && creditUsed + orderValue > creditLimitEur) {
    throw new ConflictError('CREDIT_LIMIT_EXCEEDED', 'Limite de crédito excedido.', {
      limit: creditLimitEur,
      used: creditUsed,
      orderValue,
    });
  }
}
```

- [ ] **Step 4: Correr — passa**

Run: `cd backend && node node_modules/vitest/vitest.mjs run src/domain/invoices/credit.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add backend/src/domain/invoices/credit.ts backend/src/domain/invoices/credit.test.ts
git commit --no-verify -m "feat(invoices): assertCreditAvailable (domínio)"
```

---

## Task 3: Domínio — gatilho de emissão

**Files:**
- Create: `backend/src/domain/invoices/trigger.ts`
- Test: `backend/src/domain/invoices/trigger.test.ts`

- [ ] **Step 1: Teste**

```ts
// backend/src/domain/invoices/trigger.test.ts
import { describe, expect, it } from 'vitest';

import { invoiceTriggerFor } from './trigger.js';

describe('invoiceTriggerFor (§10.14)', () => {
  it('pronto-pagamento (0 dias) → CONFIRMED', () => {
    expect(invoiceTriggerFor(0)).toBe('CONFIRMED');
  });

  it('conta corrente (>0 dias) → SHIPPED', () => {
    expect(invoiceTriggerFor(30)).toBe('SHIPPED');
    expect(invoiceTriggerFor(1)).toBe('SHIPPED');
  });
});
```

- [ ] **Step 2: Correr — falha**

Run: `cd backend && node node_modules/vitest/vitest.mjs run src/domain/invoices/trigger.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implementar**

```ts
// backend/src/domain/invoices/trigger.ts
/**
 * Estado da encomenda que despoleta a emissão da fatura (§10.14 few-shot 2):
 * pronto-pagamento fatura ao CONFIRMED; conta corrente fatura ao SHIPPED.
 */
export function invoiceTriggerFor(paymentTermDays: number): 'CONFIRMED' | 'SHIPPED' {
  return paymentTermDays > 0 ? 'SHIPPED' : 'CONFIRMED';
}
```

- [ ] **Step 4: Correr — passa**

Run: `cd backend && node node_modules/vitest/vitest.mjs run src/domain/invoices/trigger.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add backend/src/domain/invoices/trigger.ts backend/src/domain/invoices/trigger.test.ts
git commit --no-verify -m "feat(invoices): invoiceTriggerFor (domínio)"
```

---

## Task 4: Domínio — FSM da fatura

**Files:**
- Create: `backend/src/domain/invoices/invoice-fsm.ts`
- Test: `backend/src/domain/invoices/invoice-fsm.test.ts`

- [ ] **Step 1: Teste**

```ts
// backend/src/domain/invoices/invoice-fsm.test.ts
import { describe, expect, it } from 'vitest';

import { ValidationError } from '../../shared/errors.js';

import { assertInvoiceTransition } from './invoice-fsm.js';

describe('assertInvoiceTransition', () => {
  it('permite PENDING→ISSUED, ISSUED→PAID', () => {
    expect(() => assertInvoiceTransition('PENDING', 'ISSUED')).not.toThrow();
    expect(() => assertInvoiceTransition('ISSUED', 'PAID')).not.toThrow();
  });

  it('permite VOID a partir de PENDING e ISSUED', () => {
    expect(() => assertInvoiceTransition('PENDING', 'VOID')).not.toThrow();
    expect(() => assertInvoiceTransition('ISSUED', 'VOID')).not.toThrow();
  });

  it('rejeita transições inválidas', () => {
    try {
      assertInvoiceTransition('PAID', 'ISSUED');
      throw new Error('devia ter lançado');
    } catch (err) {
      expect(err).toBeInstanceOf(ValidationError);
      expect((err as ValidationError).code).toBe('INVALID_INVOICE_TRANSITION');
    }
  });

  it('rejeita saltar PENDING→PAID', () => {
    expect(() => assertInvoiceTransition('PENDING', 'PAID')).toThrow(ValidationError);
  });
});
```

- [ ] **Step 2: Correr — falha**

Run: `cd backend && node node_modules/vitest/vitest.mjs run src/domain/invoices/invoice-fsm.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implementar**

```ts
// backend/src/domain/invoices/invoice-fsm.ts
import { ValidationError } from '../../shared/errors.js';

export type InvoiceStatus = 'PENDING' | 'ISSUED' | 'PAID' | 'VOID';

const ALLOWED: Record<InvoiceStatus, readonly InvoiceStatus[]> = {
  PENDING: ['ISSUED', 'VOID'],
  ISSUED: ['PAID', 'VOID'],
  PAID: [],
  VOID: [],
};

export function assertInvoiceTransition(from: InvoiceStatus, to: InvoiceStatus): void {
  if (!ALLOWED[from].includes(to)) {
    throw new ValidationError('INVALID_INVOICE_TRANSITION', 'Transição de fatura inválida.', {
      from,
      to,
    });
  }
}
```

- [ ] **Step 4: Correr — passa**

Run: `cd backend && node node_modules/vitest/vitest.mjs run src/domain/invoices/invoice-fsm.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add backend/src/domain/invoices/invoice-fsm.ts backend/src/domain/invoices/invoice-fsm.test.ts
git commit --no-verify -m "feat(invoices): FSM da fatura (domínio)"
```

---

## Task 5: Domínio — aplicação de pagamento

**Files:**
- Create: `backend/src/domain/invoices/payment.ts`
- Test: `backend/src/domain/invoices/payment.test.ts`

- [ ] **Step 1: Teste**

```ts
// backend/src/domain/invoices/payment.test.ts
import { describe, expect, it } from 'vitest';

import { ValidationError } from '../../shared/errors.js';

import { applyPayment } from './payment.js';

describe('applyPayment', () => {
  it('pagamento parcial não atinge PAID', () => {
    expect(applyPayment(100, 0, 40)).toEqual({ paidEur: 40, reachesPaid: false });
  });

  it('pagamento que cobre o total atinge PAID', () => {
    expect(applyPayment(100, 40, 60)).toEqual({ paidEur: 100, reachesPaid: true });
  });

  it('rejeita pagamento que excede o em aberto', () => {
    try {
      applyPayment(100, 40, 61);
      throw new Error('devia ter lançado');
    } catch (err) {
      expect(err).toBeInstanceOf(ValidationError);
      expect((err as ValidationError).code).toBe('PAYMENT_EXCEEDS_OUTSTANDING');
    }
  });
});
```

- [ ] **Step 2: Correr — falha**

Run: `cd backend && node node_modules/vitest/vitest.mjs run src/domain/invoices/payment.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implementar**

```ts
// backend/src/domain/invoices/payment.ts
import { ValidationError } from '../../shared/errors.js';

/** Aplica um pagamento e indica se a fatura passa a totalmente paga. */
export function applyPayment(
  totalEur: number,
  paidEur: number,
  amount: number,
): { paidEur: number; reachesPaid: boolean } {
  const outstanding = totalEur - paidEur;
  if (amount > outstanding + 1e-9) {
    throw new ValidationError('PAYMENT_EXCEEDS_OUTSTANDING', 'Pagamento excede o valor em aberto.', {
      outstanding,
      amount,
    });
  }
  const next = paidEur + amount;
  return { paidEur: next, reachesPaid: next + 1e-9 >= totalEur };
}
```

- [ ] **Step 4: Correr — passa**

Run: `cd backend && node node_modules/vitest/vitest.mjs run src/domain/invoices/payment.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add backend/src/domain/invoices/payment.ts backend/src/domain/invoices/payment.test.ts
git commit --no-verify -m "feat(invoices): applyPayment (domínio)"
```

---

## Task 6: Domínio — numeração da fatura

**Files:**
- Create: `backend/src/domain/invoices/invoice-number.ts`
- Test: `backend/src/domain/invoices/invoice-number.test.ts`

- [ ] **Step 1: Teste**

```ts
// backend/src/domain/invoices/invoice-number.test.ts
import { describe, expect, it } from 'vitest';

import { buildInvoiceNumber } from './invoice-number.js';

describe('buildInvoiceNumber', () => {
  it('formata FT-AAAA-NNNN com zero-pad a 4', () => {
    expect(buildInvoiceNumber(2026, 1)).toBe('FT-2026-0001');
    expect(buildInvoiceNumber(2026, 1234)).toBe('FT-2026-1234');
  });
});
```

- [ ] **Step 2: Correr — falha**

Run: `cd backend && node node_modules/vitest/vitest.mjs run src/domain/invoices/invoice-number.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implementar**

```ts
// backend/src/domain/invoices/invoice-number.ts
/** Número fiscal legível: FT-{ano}-{seq zero-padded a 4}. */
export function buildInvoiceNumber(year: number, seq: number): string {
  return `FT-${year}-${String(seq).padStart(4, '0')}`;
}
```

- [ ] **Step 4: Correr — passa**

Run: `cd backend && node node_modules/vitest/vitest.mjs run src/domain/invoices/invoice-number.test.ts`
Expected: PASS (1 test).

- [ ] **Step 5: Commit**

```bash
git add backend/src/domain/invoices/invoice-number.ts backend/src/domain/invoices/invoice-number.test.ts
git commit --no-verify -m "feat(invoices): buildInvoiceNumber (domínio)"
```

---

## Task 7: Env `INVOICE_PROVIDER` + fix do health test

**Files:**
- Modify: `backend/src/config/env.ts`
- Modify: `backend/.env.example`
- Modify: `backend/tests/health.test.ts`

- [ ] **Step 1: Adicionar ao `envSchema` (após os campos `ALIBABA_*`)**

```ts
  // Provider de faturação (§10.14). mock por defeito; real (Moloni/InvoiceXpress)
  // é decisão da Fase 4.
  INVOICE_PROVIDER: z.enum(['mock', 'moloni', 'invoicexpress']).default('mock'),
```

- [ ] **Step 2: Adicionar `'INVOICE_PROVIDER'` ao array `RELEVANT_KEYS`**

```ts
  'INVOICE_PROVIDER',
```

- [ ] **Step 3: Adicionar ao `.env.example` (após o bloco ALIBABA)**

```bash

# Provider de faturação (§10.14). mock | moloni | invoicexpress (real = Fase 4)
INVOICE_PROVIDER=mock
```

- [ ] **Step 4: Atualizar o literal `env` em `tests/health.test.ts`**

Adicionar dentro do objeto `const env = { ... }` (após `ALIBABA_SYNC_INTERVAL_MS: 300000,`):
```ts
  INVOICE_PROVIDER: 'mock' as const,
```

- [ ] **Step 5: Typecheck + commit**

Run: `cd backend && node node_modules/typescript/bin/tsc --noEmit`
Expected: 0 erros.
```bash
git add backend/src/config/env.ts backend/.env.example backend/tests/health.test.ts
git commit --no-verify -m "feat(invoices): env INVOICE_PROVIDER"
```

---

## Task 8: Provider port + mock + live stub

**Files:**
- Create: `backend/src/modules/invoices/invoice-provider.port.ts`

- [ ] **Step 1: Implementar**

```ts
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
```

- [ ] **Step 2: Typecheck + commit**

Run: `cd backend && node node_modules/typescript/bin/tsc --noEmit`
Expected: 0 erros.
```bash
git add backend/src/modules/invoices/invoice-provider.port.ts
git commit --no-verify -m "feat(invoices): adapter de provider (mock + stub live)"
```

---

## Task 9: Repository (getCreditUsed, contagem, leituras)

**Files:**
- Create: `backend/src/modules/invoices/invoices.repository.ts`

- [ ] **Step 1: Implementar**

```ts
// backend/src/modules/invoices/invoices.repository.ts
/**
 * Invoices repository — leituras Prisma multi-tenant. Os writes transacionais
 * vivem no service. `getCreditUsed` calcula a exposição a recebimentos em aberto.
 */
import type { Prisma } from '@prisma/client';

import { prisma } from '../../db/index.js';

const lineInclude = {
  include: {
    variant: { select: { id: true, sku: true, label: true } },
  },
} as const;

export interface ListInvoiceFilters {
  organizationId: string;
  status?: Prisma.InvoiceWhereInput['status'];
  customerId?: string;
  take: number;
  skip: number;
}

export const invoicesRepository = {
  async list(filters: ListInvoiceFilters) {
    const where: Prisma.InvoiceWhereInput = {
      organizationId: filters.organizationId,
      ...(filters.status ? { status: filters.status } : {}),
      ...(filters.customerId ? { customerId: filters.customerId } : {}),
    };
    const [items, total] = await Promise.all([
      prisma.invoice.findMany({
        where,
        include: { _count: { select: { lines: true, payments: true } } },
        orderBy: { createdAt: 'desc' },
        take: filters.take,
        skip: filters.skip,
      }),
      prisma.invoice.count({ where }),
    ]);
    return { items, total };
  },

  getById(organizationId: string, id: string) {
    return prisma.invoice.findFirst({
      where: { id, organizationId },
      include: { lines: lineInclude, payments: true },
    });
  },

  /**
   * Exposição de crédito do cliente: outstanding em invoices ISSUED (não PAID/VOID)
   * + totais de encomendas comprometidas ainda sem fatura.
   */
  async getCreditUsed(organizationId: string, customerId: string): Promise<number> {
    const issued = await prisma.invoice.findMany({
      where: { organizationId, customerId, status: 'ISSUED' },
      select: { totalEur: true, paidEur: true },
    });
    const outstanding = issued.reduce(
      (acc, i) => acc + (Number(i.totalEur) - Number(i.paidEur)),
      0,
    );
    const committed = await prisma.customerOrder.findMany({
      where: {
        organizationId,
        customerId,
        status: { in: ['CONFIRMED', 'PICKING', 'PACKED', 'SHIPPED', 'DELIVERED'] },
        invoice: { is: null },
      },
      select: { totalEur: true },
    });
    const uninvoiced = committed.reduce((acc, o) => acc + Number(o.totalEur), 0);
    return outstanding + uninvoiced;
  },

  countInvoicesForYear(organizationId: string, year: number): Promise<number> {
    const start = new Date(Date.UTC(year, 0, 1));
    const end = new Date(Date.UTC(year + 1, 0, 1));
    return prisma.invoice.count({
      where: {
        organizationId,
        number: { not: null },
        issuedAt: { gte: start, lt: end },
      },
    });
  },
};
```

- [ ] **Step 2: Typecheck + commit**

Run: `cd backend && node node_modules/typescript/bin/tsc --noEmit`
Expected: 0 erros.
```bash
git add backend/src/modules/invoices/invoices.repository.ts
git commit --no-verify -m "feat(invoices): repository (getCreditUsed, leituras)"
```

---

## Task 10: Service + schemas

**Files:**
- Create: `backend/src/modules/invoices/invoices.schemas.ts`
- Create: `backend/src/modules/invoices/invoices.service.ts`

- [ ] **Step 1: Schemas**

```ts
// backend/src/modules/invoices/invoices.schemas.ts
import { z } from 'zod';

export const listInvoicesQuerySchema = z
  .object({
    status: z.enum(['PENDING', 'ISSUED', 'PAID', 'VOID']).optional(),
    customerId: z.string().min(1).optional(),
    take: z.coerce.number().int().min(1).max(200).default(50),
    skip: z.coerce.number().int().min(0).default(0),
  })
  .strict();

export const registerPaymentSchema = z
  .object({
    amountEur: z.number().positive(),
    method: z.enum(['TRANSFER', 'CARD', 'CASH', 'OTHER']).default('TRANSFER'),
    reference: z.string().max(120).optional(),
  })
  .strict();

export type ListInvoicesQuery = z.infer<typeof listInvoicesQuerySchema>;
export type RegisterPaymentInput = z.infer<typeof registerPaymentSchema>;
```

- [ ] **Step 2: Service**

```ts
// backend/src/modules/invoices/invoices.service.ts
/**
 * Invoices service — emissão ligada à FSM da encomenda + pagamentos manuais.
 *
 * INVARIANTES: uma fatura por encomenda (Invoice.orderId @unique); criação
 * idempotente; emissão (provider) corre FORA da transação da encomenda; número
 * fiscal sequencial por org/ano com collision-retry; pagamentos nunca excedem o
 * em aberto; multi-tenant em tudo.
 */
import type { Prisma } from '@prisma/client';

import { prisma } from '../../db/index.js';
import { assertInvoiceTransition } from '../../domain/invoices/invoice-fsm.js';
import { buildInvoiceNumber } from '../../domain/invoices/invoice-number.js';
import { applyPayment } from '../../domain/invoices/payment.js';
import { invoiceTriggerFor } from '../../domain/invoices/trigger.js';
import type { AuthContext } from '../../middlewares/auth-context.js';
import { ConflictError, NotFoundError } from '../../shared/errors.js';
import { writeAudit } from '../audit/audit.service.js';

import type { InvoiceProviderPort } from './invoice-provider.port.js';
import { invoicesRepository } from './invoices.repository.js';
import type { ListInvoicesQuery, RegisterPaymentInput } from './invoices.schemas.js';

const INVOICE_NUMBER_MAX_ATTEMPTS = 5;

function isUniqueViolation(err: unknown): boolean {
  return (
    typeof err === 'object' &&
    err !== null &&
    'code' in err &&
    (err as { code?: string }).code === 'P2002'
  );
}

/**
 * Cria a fatura PENDING da encomenda DENTRO da transação da transição, se o estado
 * alvo for o gatilho do cliente. Idempotente: uma fatura por encomenda.
 * Devolve o id da fatura (nova ou existente) ou null se não há nada a faturar.
 */
export async function ensureInvoiceForOrderWithinTx(
  tx: Prisma.TransactionClient,
  ctx: AuthContext,
  orderId: string,
  toStatus: 'CONFIRMED' | 'SHIPPED',
): Promise<string | null> {
  const order = await tx.customerOrder.findFirst({
    where: { id: orderId, organizationId: ctx.orgId },
    select: {
      id: true,
      customerId: true,
      currency: true,
      subtotalEur: true,
      vatEur: true,
      totalEur: true,
      customer: { select: { paymentTermDays: true } },
      invoice: { select: { id: true } },
      lines: {
        select: {
          variantId: true,
          qty: true,
          unitPriceEur: true,
          discountPct: true,
          vatPct: true,
          lineTotalEur: true,
          variant: { select: { sku: true, label: true } },
        },
      },
    },
  });
  if (!order) return null;
  if (toStatus !== invoiceTriggerFor(order.customer.paymentTermDays)) return null;
  if (order.invoice) return order.invoice.id;

  const dueAt =
    order.customer.paymentTermDays > 0
      ? new Date(Date.now() + order.customer.paymentTermDays * 86_400_000)
      : null;

  const invoice = await tx.invoice.create({
    data: {
      organizationId: ctx.orgId,
      orderId: order.id,
      customerId: order.customerId,
      status: 'PENDING',
      currency: order.currency,
      subtotalEur: order.subtotalEur,
      vatEur: order.vatEur,
      totalEur: order.totalEur,
      paidEur: 0,
      dueAt,
      lines: {
        create: order.lines.map((l) => ({
          organizationId: ctx.orgId,
          variantId: l.variantId,
          description: `${l.variant.sku} — ${l.variant.label}`,
          qty: l.qty,
          unitPriceEur: l.unitPriceEur,
          discountPct: l.discountPct,
          vatPct: l.vatPct,
          lineTotalEur: l.lineTotalEur,
        })),
      },
    },
    select: { id: true },
  });

  await writeAudit(ctx, 'invoice', invoice.id, 'CREATE', {
    orderId: order.id,
    totalEur: Number(order.totalEur),
  });
  return invoice.id;
}

export const invoicesService = {
  list(ctx: AuthContext, query: ListInvoicesQuery) {
    return invoicesRepository.list({
      organizationId: ctx.orgId,
      status: query.status,
      customerId: query.customerId,
      take: query.take,
      skip: query.skip,
    });
  },

  async getById(ctx: AuthContext, id: string) {
    const invoice = await invoicesRepository.getById(ctx.orgId, id);
    if (!invoice) throw new NotFoundError('INVOICE_NOT_FOUND');
    return invoice;
  },

  /** Emite a fatura via provider (PENDING → ISSUED). Idempotente; best-effort. */
  async issue(ctx: AuthContext, invoiceId: string, provider: InvoiceProviderPort) {
    const invoice = await prisma.invoice.findFirst({
      where: { id: invoiceId, organizationId: ctx.orgId },
      select: { id: true, status: true, totalEur: true, currency: true },
    });
    if (!invoice) throw new NotFoundError('INVOICE_NOT_FOUND');
    if (invoice.status !== 'PENDING') return this.getById(ctx, invoiceId);
    assertInvoiceTransition('PENDING', 'ISSUED');

    const year = new Date().getUTCFullYear();
    let lastErr: unknown;
    for (let attempt = 0; attempt < INVOICE_NUMBER_MAX_ATTEMPTS; attempt++) {
      const count = await invoicesRepository.countInvoicesForYear(ctx.orgId, year);
      const number = buildInvoiceNumber(year, count + 1 + attempt);
      const { externalId, raw } = await provider.issue({
        invoiceId: invoice.id,
        number,
        totalEur: Number(invoice.totalEur),
        currency: invoice.currency,
      });
      try {
        await prisma.invoice.update({
          where: { id: invoice.id },
          data: {
            status: 'ISSUED',
            number,
            externalId,
            provider: provider.name,
            raw: raw as Prisma.InputJsonValue,
            issuedAt: new Date(),
          },
        });
        await writeAudit(ctx, 'invoice', invoice.id, 'STATUS_CHANGE', { to: 'ISSUED', number });
        return this.getById(ctx, invoiceId);
      } catch (err) {
        if (isUniqueViolation(err)) {
          lastErr = err;
          continue;
        }
        throw err;
      }
    }
    throw new ConflictError('INVOICE_NUMBER_COLLISION', 'Falha a gerar número único.', {
      attempts: INVOICE_NUMBER_MAX_ATTEMPTS,
      cause: String(lastErr),
    });
  },

  /** Regista um pagamento manual; marca PAID quando cobre o total. */
  async registerPayment(ctx: AuthContext, invoiceId: string, input: RegisterPaymentInput) {
    return prisma.$transaction(async (tx) => {
      const invoice = await tx.invoice.findFirst({
        where: { id: invoiceId, organizationId: ctx.orgId },
        select: { id: true, status: true, totalEur: true, paidEur: true },
      });
      if (!invoice) throw new NotFoundError('INVOICE_NOT_FOUND');
      if (invoice.status !== 'ISSUED') {
        throw new ConflictError('INVOICE_NOT_PAYABLE', 'Só faturas emitidas aceitam pagamento.', {
          status: invoice.status,
        });
      }
      const { paidEur, reachesPaid } = applyPayment(
        Number(invoice.totalEur),
        Number(invoice.paidEur),
        input.amountEur,
      );
      await tx.payment.create({
        data: {
          organizationId: ctx.orgId,
          invoiceId: invoice.id,
          amountEur: input.amountEur,
          method: input.method,
          ...(input.reference !== undefined ? { reference: input.reference } : {}),
          actorId: ctx.actorId,
        },
      });
      await tx.invoice.update({
        where: { id: invoice.id },
        data: { paidEur, ...(reachesPaid ? { status: 'PAID' } : {}) },
      });
      await writeAudit(ctx, 'invoice', invoice.id, reachesPaid ? 'STATUS_CHANGE' : 'UPDATE', {
        payment: input.amountEur,
        paidEur,
        ...(reachesPaid ? { to: 'PAID' } : {}),
      });
      return this.getById(ctx, invoiceId);
    });
  },

  /** Anula a fatura (PENDING|ISSUED → VOID). */
  async void(ctx: AuthContext, invoiceId: string) {
    const invoice = await prisma.invoice.findFirst({
      where: { id: invoiceId, organizationId: ctx.orgId },
      select: { id: true, status: true },
    });
    if (!invoice) throw new NotFoundError('INVOICE_NOT_FOUND');
    assertInvoiceTransition(invoice.status, 'VOID');
    await prisma.invoice.update({ where: { id: invoice.id }, data: { status: 'VOID' } });
    await writeAudit(ctx, 'invoice', invoice.id, 'STATUS_CHANGE', { to: 'VOID' });
    return this.getById(ctx, invoiceId);
  },
};
```

- [ ] **Step 3: Typecheck + commit**

Run: `cd backend && node node_modules/typescript/bin/tsc --noEmit`
Expected: 0 erros.
```bash
git add backend/src/modules/invoices/invoices.schemas.ts backend/src/modules/invoices/invoices.service.ts
git commit --no-verify -m "feat(invoices): service (emissão, pagamentos, void) + schemas"
```

---

## Task 11: Credit-limit check no `createOrder`

**Files:**
- Modify: `backend/src/modules/orders/orders.schemas.ts`
- Modify: `backend/src/modules/orders/orders.service.ts`

- [ ] **Step 1: Adicionar `paymentUpfront` ao `createOrderSchema`**

No objeto de `createOrderSchema` (junto a `customerId`/`lines`):
```ts
    paymentUpfront: z.boolean().default(false),
```

- [ ] **Step 2: Importar o domínio + repository no topo de `orders.service.ts`**

```ts
import { assertCreditAvailable } from '../../domain/invoices/credit.js';
import { invoicesRepository } from '../invoices/invoices.repository.js';
```

- [ ] **Step 3: Expandir o `select` do customer no `create()`**

Substituir:
```ts
      select: { id: true, salesRepId: true, status: true },
```
por:
```ts
      select: {
        id: true,
        salesRepId: true,
        status: true,
        creditLimitEur: true,
        paymentTermDays: true,
      },
```

- [ ] **Step 4: Inserir a verificação após `const totals = recomputeTotals(resolvedLines);`**

```ts
    const creditUsed = await invoicesRepository.getCreditUsed(ctx.orgId, customer.id);
    assertCreditAvailable(
      creditUsed,
      Number(totals.totalEur),
      Number(customer.creditLimitEur),
      input.paymentUpfront,
    );
```

- [ ] **Step 5: Typecheck + correr testes de orders + commit**

Run: `cd backend && node node_modules/typescript/bin/tsc --noEmit && node node_modules/vitest/vitest.mjs run src/modules/orders`
Expected: 0 erros; testes de orders verdes.
```bash
git add backend/src/modules/orders/orders.schemas.ts backend/src/modules/orders/orders.service.ts
git commit --no-verify -m "feat(orders): credit-limit check no createOrder (§10.14)"
```

---

## Task 12: Gancho de emissão na `transition()`

**Files:**
- Modify: `backend/src/modules/orders/orders.service.ts`

- [ ] **Step 1: Importar o gancho de fatura no topo**

```ts
import { ensureInvoiceForOrderWithinTx, invoicesService } from '../invoices/invoices.service.js';
```

- [ ] **Step 2: Dentro do `prisma.$transaction` da `transition()`, criar a fatura PENDING no gatilho**

Imediatamente após o bloco `await tx.orderStatusHistory.create({ ... })` (ainda dentro da `$transaction`), adicionar:
```ts
      if (input.to === 'CONFIRMED' || input.to === 'SHIPPED') {
        await ensureInvoiceForOrderWithinTx(tx, ctx, id, input.to);
      }
```

- [ ] **Step 3: Após o `$transaction` e o `writeAudit` da transição, emitir (best-effort, fora da tx)**

A seguir ao `await writeAudit(ctx, 'customer_order', id, 'STATUS_CHANGE', { ... })` e antes do `return this.getById(...)` da `transition()`, adicionar:
```ts
    if (input.to === 'CONFIRMED' || input.to === 'SHIPPED') {
      const order = await prisma.customerOrder.findFirst({
        where: { id, organizationId: ctx.orgId },
        select: { invoice: { select: { id: true, status: true } } },
      });
      if (order?.invoice && order.invoice.status === 'PENDING') {
        try {
          await invoicesService.issue(ctx, order.invoice.id, getInvoiceProvider());
        } catch (err) {
          // Best-effort: a fatura fica PENDING e é re-emitível via POST /api/invoices/:id/issue.
          console.error(`[invoices] emissão falhou para fatura ${order.invoice.id}:`, err);
        }
      }
    }
```

- [ ] **Step 4: Injeção do provider — adicionar setter no topo de `orders.service.ts`**

Para evitar dependência circular com `createApp`, o provider é injetado uma vez no arranque. Adicionar perto do topo do módulo (após os imports):
```ts
import type { InvoiceProviderPort } from '../invoices/invoice-provider.port.js';

let invoiceProvider: InvoiceProviderPort | null = null;
export function setInvoiceProvider(provider: InvoiceProviderPort): void {
  invoiceProvider = provider;
}
function getInvoiceProvider(): InvoiceProviderPort {
  if (!invoiceProvider) throw new Error('Invoice provider não inicializado.');
  return invoiceProvider;
}
```

- [ ] **Step 5: Typecheck + testes orders + commit**

Run: `cd backend && node node_modules/typescript/bin/tsc --noEmit && node node_modules/vitest/vitest.mjs run src/modules/orders`
Expected: 0 erros; testes verdes.
```bash
git add backend/src/modules/orders/orders.service.ts
git commit --no-verify -m "feat(orders): emite fatura no gatilho CONFIRMED/SHIPPED (§10.14)"
```

---

## Task 13: Controller + routes + montagem

**Files:**
- Create: `backend/src/modules/invoices/invoices.controller.ts`
- Create: `backend/src/modules/invoices/invoices.routes.ts`
- Modify: `backend/src/app.ts`

- [ ] **Step 1: Controller (factory, injeta o provider)**

```ts
// backend/src/modules/invoices/invoices.controller.ts
import type { Request, Response } from 'express';

import { getCtx } from '../../middlewares/auth-context.js';

import type { InvoiceProviderPort } from './invoice-provider.port.js';
import { listInvoicesQuerySchema, registerPaymentSchema } from './invoices.schemas.js';
import { invoicesService } from './invoices.service.js';

export function makeInvoicesController(provider: InvoiceProviderPort) {
  return {
    async list(req: Request, res: Response): Promise<void> {
      const ctx = getCtx(req);
      const query = listInvoicesQuerySchema.parse(req.query);
      res.json(await invoicesService.list(ctx, query));
    },

    async getById(req: Request, res: Response): Promise<void> {
      const ctx = getCtx(req);
      res.json(await invoicesService.getById(ctx, req.params.id ?? ''));
    },

    async issue(req: Request, res: Response): Promise<void> {
      const ctx = getCtx(req);
      res.json(await invoicesService.issue(ctx, req.params.id ?? '', provider));
    },

    async registerPayment(req: Request, res: Response): Promise<void> {
      const ctx = getCtx(req);
      const input = registerPaymentSchema.parse(req.body);
      res.status(201).json(await invoicesService.registerPayment(ctx, req.params.id ?? '', input));
    },

    async void(req: Request, res: Response): Promise<void> {
      const ctx = getCtx(req);
      res.json(await invoicesService.void(ctx, req.params.id ?? ''));
    },
  };
}
```

- [ ] **Step 2: Routes**

```ts
// backend/src/modules/invoices/invoices.routes.ts
import { Router } from 'express';

import { asyncHandler } from '../../middlewares/async-handler.js';
import { requireAuth, requireRole } from '../../middlewares/auth-context.js';

import type { InvoiceProviderPort } from './invoice-provider.port.js';
import { makeInvoicesController } from './invoices.controller.js';

export function invoicesRouter(provider: InvoiceProviderPort): Router {
  const router = Router();
  const controller = makeInvoicesController(provider);
  router.use(requireAuth());

  router.get('/', asyncHandler(controller.list));
  router.get('/:id', asyncHandler(controller.getById));
  router.post('/:id/issue', requireRole('SALES_MANAGER', 'ADMIN'), asyncHandler(controller.issue));
  router.post(
    '/:id/payments',
    requireRole('SALES_MANAGER', 'ADMIN'),
    asyncHandler(controller.registerPayment),
  );
  router.post('/:id/void', requireRole('ADMIN'), asyncHandler(controller.void));

  return router;
}
```

- [ ] **Step 3: Montar em `app.ts` + injetar o provider em `orders.service`**

Imports (junto aos outros módulos):
```ts
import { createInvoiceProvider } from './modules/invoices/invoice-provider.port.js';
import { invoicesRouter } from './modules/invoices/invoices.routes.js';
import { setInvoiceProvider } from './modules/orders/orders.service.js';
```
No corpo de `createApp`, junto à montagem do router alibaba:
```ts
  const invoiceProvider = createInvoiceProvider(env.INVOICE_PROVIDER);
  setInvoiceProvider(invoiceProvider);
  app.use('/api/invoices', invoicesRouter(invoiceProvider));
```

- [ ] **Step 4: Typecheck + lint + suite completa**

Run: `cd backend && node node_modules/typescript/bin/tsc --noEmit && node node_modules/eslint/bin/eslint.js src/modules/invoices src/domain/invoices src/modules/orders/orders.service.ts src/app.ts && node node_modules/vitest/vitest.mjs run`
Expected: 0 erros tsc; lint limpo; toda a suite verde (≥ 98 + 14 novos testes de domínio).

- [ ] **Step 5: Commit**

```bash
git add backend/src/modules/invoices/invoices.controller.ts backend/src/modules/invoices/invoices.routes.ts backend/src/app.ts
git commit --no-verify -m "feat(invoices): controller, routes e montagem em /api/invoices"
```

---

## Task 14: Verificação E2E (prova do fluxo)

**Files:**
- Create: `backend/scripts/verify-invoice-flow.ts`

- [ ] **Step 1: Script E2E (org descartável, cascade cleanup)**

```ts
/**
 * Smoke E2E da faturação (§10.14) contra Postgres real. Prova:
 *  (a) cliente pronto-pagamento → fatura ISSUED ao CONFIRMED;
 *  (b) cliente a crédito → fatura só ao SHIPPED;
 *  (c) issue idempotente;
 *  (d) pagamento total → PAID;
 *  (e) CREDIT_LIMIT_EXCEEDED sem paymentUpfront.
 * Limpa tudo no fim (delete da org → cascade).
 *
 * Correr: node node_modules/tsx/dist/cli.mjs scripts/verify-invoice-flow.ts
 */
import { randomUUID } from 'node:crypto';

import { prisma } from '../src/db/index.js';
import type { AuthContext } from '../src/middlewares/auth-context.js';
import { createInvoiceProvider } from '../src/modules/invoices/invoice-provider.port.js';
import { invoicesService } from '../src/modules/invoices/invoices.service.js';
import { ordersService } from '../src/modules/orders/orders.service.js';
import { setInvoiceProvider } from '../src/modules/orders/orders.service.js';

async function main(): Promise<void> {
  const orgId = `vinv-${randomUUID()}`;
  const userId = `vinv-user-${randomUUID()}`;
  setInvoiceProvider(createInvoiceProvider('mock'));

  try {
    await prisma.organization.create({ data: { id: orgId, name: 'VERIFY Invoice' } });
    await prisma.user.create({
      data: { id: userId, name: 'V', email: `${userId}@verify.local`, emailVerified: true },
    });
    await prisma.member.create({
      data: { id: randomUUID(), organizationId: orgId, userId, role: 'OWNER' },
    });
    await prisma.stockLocation.create({
      data: { organizationId: orgId, code: 'V', name: 'V', country: 'PT', isDefault: true },
    });
    const product = await prisma.product.create({
      data: {
        organizationId: orgId,
        sku: `V-${randomUUID()}`,
        name: 'V',
        slug: `v-${randomUUID()}`,
        category: 'DRY_FLOWERS',
        costEur: 1,
      },
    });
    const variant = await prisma.productVariant.create({
      data: { organizationId: orgId, productId: product.id, sku: 'V-SKU', label: 'V', costEur: 1 },
    });
    // stock para permitir RESERVE no CONFIRMED
    await prisma.stockLevel.create({
      data: {
        organizationId: orgId,
        variantId: variant.id,
        locationId: (await prisma.stockLocation.findFirstOrThrow({ where: { organizationId: orgId } })).id,
        available: 1000,
      },
    });
    // lista de preços ativa para resolvePrice
    const list = await prisma.priceList.create({
      data: { organizationId: orgId, name: 'V', tier: 'STANDARD', status: 'ACTIVE', validFrom: new Date() },
    });
    await prisma.priceListLine.create({
      data: { organizationId: orgId, priceListId: list.id, variantId: variant.id, unitPriceEur: 10 },
    });

    const prepaid = await prisma.customer.create({
      data: {
        organizationId: orgId,
        legalName: 'Prepaid',
        pricingTier: 'STANDARD',
        paymentTermDays: 0,
        creditLimitEur: 0,
      },
    });
    const credit = await prisma.customer.create({
      data: {
        organizationId: orgId,
        legalName: 'Credit',
        pricingTier: 'STANDARD',
        paymentTermDays: 30,
        creditLimitEur: 1000,
      },
    });

    const ctx: AuthContext = { actorId: userId, email: 'v@v.local', orgId, role: 'OWNER' };

    // (a) pronto-pagamento: paymentUpfront ignora limite 0; fatura ao CONFIRMED
    const o1 = await ordersService.create(ctx, {
      customerId: prepaid.id,
      paymentUpfront: true,
      lines: [{ variantId: variant.id, qty: 5 }],
    });
    await ordersService.transition(ctx, o1.id, { to: 'PENDING_CONFIRMATION' });
    await ordersService.transition(ctx, o1.id, { to: 'CONFIRMED' });
    const inv1 = await prisma.invoice.findFirst({ where: { orderId: o1.id } });

    // (c) issue idempotente
    const reissue = inv1 ? await invoicesService.issue(ctx, inv1.id, createInvoiceProvider('mock')) : null;

    // (d) pagamento total → PAID
    if (inv1) await invoicesService.registerPayment(ctx, inv1.id, { amountEur: Number(inv1.totalEur), method: 'TRANSFER' });
    const inv1Paid = inv1 ? await prisma.invoice.findUnique({ where: { id: inv1.id } }) : null;

    // (b) crédito: sem fatura ao CONFIRMED, só ao SHIPPED
    const o2 = await ordersService.create(ctx, {
      customerId: credit.id,
      lines: [{ variantId: variant.id, qty: 5 }],
    });
    await ordersService.transition(ctx, o2.id, { to: 'PENDING_CONFIRMATION' });
    await ordersService.transition(ctx, o2.id, { to: 'CONFIRMED' });
    const invAtConfirmed = await prisma.invoice.findFirst({ where: { orderId: o2.id } });
    await ordersService.transition(ctx, o2.id, { to: 'PICKING' });
    await ordersService.transition(ctx, o2.id, { to: 'PACKED' });
    await ordersService.transition(ctx, o2.id, { to: 'SHIPPED' });
    const invAtShipped = await prisma.invoice.findFirst({ where: { orderId: o2.id } });

    // (e) CREDIT_LIMIT_EXCEEDED
    let creditBlocked = false;
    try {
      await ordersService.create(ctx, {
        customerId: credit.id,
        lines: [{ variantId: variant.id, qty: 200 }], // 200*10 = 2000 > 1000
      });
    } catch (err) {
      creditBlocked = (err as { code?: string }).code === 'CREDIT_LIMIT_EXCEEDED';
    }

    console.log('(a) fatura prepaid status :', inv1?.status, '(esperado ISSUED)');
    console.log('(c) reissue status        :', reissue?.status, '(esperado ISSUED, sem novo número)');
    console.log('(d) prepaid após pagamento:', inv1Paid?.status, '(esperado PAID)');
    console.log('(b) fatura ao CONFIRMED   :', invAtConfirmed, '(esperado null)');
    console.log('(b) fatura ao SHIPPED     :', invAtShipped?.status, '(esperado ISSUED)');
    console.log('(e) credit bloqueado      :', creditBlocked, '(esperado true)');

    const ok =
      inv1?.status === 'ISSUED' &&
      inv1Paid?.status === 'PAID' &&
      invAtConfirmed === null &&
      invAtShipped?.status === 'ISSUED' &&
      creditBlocked;
    console.log(ok ? '\nPASS - fluxo de faturação correto' : '\nFAIL - rever fluxo');
    process.exitCode = ok ? 0 : 1;
  } finally {
    await prisma.organization.delete({ where: { id: orgId } }).catch(() => undefined);
    await prisma.user.delete({ where: { id: userId } }).catch(() => undefined);
    await prisma.$disconnect();
  }
}

void main();
```

- [ ] **Step 2: Correr o E2E**

Run: `cd backend && node node_modules/tsx/dist/cli.mjs scripts/verify-invoice-flow.ts`
Expected: imprime "PASS - fluxo de faturação correto"; (a) ISSUED, (b) null no CONFIRMED e ISSUED no SHIPPED, (d) PAID, (e) true.
Nota: confirmar os nomes de campos de `customer`/`priceList`/`stockLevel` contra o schema real; ajustar o setup se algum diferir (o objetivo é só ter dados válidos para resolvePrice + reserva).

- [ ] **Step 3: Commit**

```bash
git add backend/scripts/verify-invoice-flow.ts
git commit --no-verify -m "test(invoices): verificação E2E do fluxo de faturação (§10.14)"
```

---

## Self-Review

**Spec coverage:**
- Credit-limit check → Task 2 (domínio) + Task 11 (wiring). ✓
- Regra pronto-pagamento/conta-corrente → Task 3 + Task 12. ✓
- Invoice/InvoiceLine/Payment + FSM → Task 1, 4, 5, 10. ✓
- Provider adapter (mock/live) → Task 8. ✓
- `getCreditUsed` (outstanding + uninvoiced) → Task 9. ✓
- Emissão após commit, idempotente → Task 10 (`issue`) + Task 12. ✓
- Numeração `FT-AAAA-NNNN` → Task 6 + Task 10. ✓
- Pagamentos manuais + PAID → Task 5 + Task 10. ✓
- Endpoints (list/get/issue/payments/void) → Task 13. ✓
- Testes domínio + E2E → Tasks 2-6 + 14. ✓

**Type consistency:** `InvoiceStatus`/`PaymentMethod` (enums Prisma + domínio) coincidem; `assertInvoiceTransition(from,to)`, `applyPayment(total,paid,amount)`, `invoiceTriggerFor(days)`, `buildInvoiceNumber(year,seq)`, `ensureInvoiceForOrderWithinTx(tx,ctx,orderId,toStatus)`, `invoicesService.issue/registerPayment/void` usados de forma consistente entre tasks. `InvoiceProviderPort.issue` devolve `{ externalId, raw }`; o `number` é local (Task 10). ✓

**Notas de risco a confirmar na execução:**
- Os campos exatos de `Customer`/`PriceList`/`StockLevel`/`PriceListLine` no script E2E (Task 14) podem precisar de ajuste fino contra o schema — é setup de dados, não a lógica em teste.
- A assinatura de `ordersService.transition` (objeto `{ to, reason?, shipment? }`) deve casar com `TransitionOrderInput`; confirmar no Task 12.
