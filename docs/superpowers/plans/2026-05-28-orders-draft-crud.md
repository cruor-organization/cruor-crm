# Encomendas (DRAFT) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Adicionar o núcleo de encomendas de cliente como CRUD limitado ao estado `DRAFT` — schema (CustomerOrder/Line/StatusHistory + enum), módulo backend completo, com snapshots de preço e recálculo de totais no servidor.

**Architecture:** Módulo `routes → controller → service → repository → schemas` + funções puras de domínio, igual aos módulos existentes. Preço por linha reutiliza `pricingService.resolve` (floor incluído). Writes transacionais no service via `prisma.$transaction`; `orderNumber` sequencial por org com retry em loop externo à transação. ABAC via `scopeForRole` (SALES_REP só vê os seus). Mutações só em DRAFT.

**Tech Stack:** TypeScript (ESM, `.js` nos imports), Prisma 5 + Postgres, Express, Zod `.strict()`, Vitest. Comandos: `pnpm -C backend test`, `pnpm -C backend typecheck`, `cd backend && pnpm db:migrate:dev`.

---

## Estado de execução (pausa 2026-05-28)

Execução inline pausada a pedido do utilizador. Retomar daqui:

- ✅ **Task 1 — completa e commitada** (`e568ef2`). Schema editado, back-relations adicionadas, migration `backend/prisma/migrations/20260528_orders_draft/` **aplicada na DB de dev** e Prisma Client regenerado; typecheck verde.
  - Nota: `prisma migrate dev` falha em ambiente não-interativo. O fluxo usado foi: gerar SQL com `npx prisma migrate diff --from-schema-datasource prisma/schema.prisma --to-schema-datamodel prisma/schema.prisma --script > .../migration.sql` e aplicar com `pnpm db:migrate` (deploy). Repetir este fluxo nas próximas migrations enquanto o ambiente não tiver TTY.
- 🔄 **Task 2 — a meio.** O ficheiro de teste `backend/src/domain/orders/recompute-totals.test.ts` **já está escrito** (não commitado). **Próximo passo concreto**: Step 2 (correr o teste e ver falhar) → Step 3 (criar `recompute-totals.ts`) → Step 4 (passar) → Step 5 (commit). Continuar depois com Tasks 3–10 conforme abaixo.
- ⬜ **Tasks 3–10** — por fazer.

Pré-requisito para retomar: DB de dev a correr (`supabase_db` / `make up`). Trabalho na branch `main` (convenção solo do utilizador).

---

## Ficheiros

- Criar: `backend/src/domain/orders/recompute-totals.ts` — função pura: linhas → {subtotal, vat, total}.
- Criar: `backend/src/domain/orders/recompute-totals.test.ts`
- Criar: `backend/src/domain/orders/order-number.ts` — formata `ENC-{ano}-{seq}`.
- Criar: `backend/src/domain/orders/order-number.test.ts`
- Criar: `backend/src/modules/orders/orders.schemas.ts` — Zod inputs.
- Criar: `backend/src/modules/orders/orders.repository.ts` — leituras Prisma.
- Criar: `backend/src/modules/orders/orders.service.ts` — regras de negócio (exporta guards puras).
- Criar: `backend/src/modules/orders/orders.service.test.ts` — testes das guards puras.
- Criar: `backend/src/modules/orders/orders.controller.ts` — parse → service → resposta.
- Criar: `backend/src/modules/orders/orders.routes.ts` — rotas + guards.
- Modificar: `backend/prisma/schema.prisma` — enum + 3 modelos + back-relations.
- Modificar: `backend/src/app.ts` — registar `/api/orders`.

---

## Task 1: Schema Prisma + migration

**Files:**

- Modify: `backend/prisma/schema.prisma`

- [ ] **Step 1: Adicionar o enum e os três modelos ao fim do `schema.prisma`**

```prisma
enum OrderStatus {
  DRAFT
  PENDING_CONFIRMATION
  CONFIRMED
  PICKING
  PACKED
  SHIPPED
  DELIVERED
  CANCELLED
  RETURN_REQUESTED
  RETURN_RECEIVED
  REFUNDED
  REPLACED
}

model CustomerOrder {
  id                    String      @id @default(cuid())
  organizationId        String
  orderNumber           String
  customerId            String
  salesRepId            String?
  status                OrderStatus @default(DRAFT)
  currency              String      @default("EUR") @db.Char(3)
  subtotalEur           Decimal     @default(0) @db.Decimal(14, 2)
  vatEur                Decimal     @default(0) @db.Decimal(14, 2)
  totalEur              Decimal     @default(0) @db.Decimal(14, 2)
  notes                 String?
  requestedDeliveryDate DateTime?
  shippingAddress       Json?
  createdAt             DateTime    @default(now())
  updatedAt             DateTime    @updatedAt

  organization Organization         @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  customer     Customer             @relation(fields: [customerId], references: [id], onDelete: Restrict)
  salesRep     User?                @relation("CustomerOrderSalesRep", fields: [salesRepId], references: [id], onDelete: SetNull)
  lines        CustomerOrderLine[]
  history      OrderStatusHistory[]

  @@unique([organizationId, orderNumber])
  @@index([organizationId, status])
  @@index([organizationId, customerId])
  @@index([organizationId, salesRepId])
  @@map("customer_order")
}

model CustomerOrderLine {
  id             String   @id @default(cuid())
  organizationId String
  orderId        String
  variantId      String
  qty            Int
  unitPriceEur   Decimal  @db.Decimal(12, 2)
  discountPct    Decimal  @default(0) @db.Decimal(5, 4)
  vatPct         Decimal  @default(0) @db.Decimal(5, 2)
  lineTotalEur   Decimal  @db.Decimal(14, 2)
  priceSource    String
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  order   CustomerOrder  @relation(fields: [orderId], references: [id], onDelete: Cascade)
  variant ProductVariant @relation(fields: [variantId], references: [id], onDelete: Restrict)

  @@unique([orderId, variantId])
  @@index([organizationId, orderId])
  @@map("customer_order_line")
}

model OrderStatusHistory {
  id             String       @id @default(cuid())
  organizationId String
  orderId        String
  fromStatus     OrderStatus?
  toStatus       OrderStatus
  actorId        String?
  reason         String?
  createdAt      DateTime     @default(now())

  order CustomerOrder @relation(fields: [orderId], references: [id], onDelete: Cascade)

  @@index([organizationId, orderId])
  @@map("order_status_history")
}
```

- [ ] **Step 2: Adicionar as back-relations nos modelos existentes**

No `model Organization` (junto às outras relações), adicionar:

```prisma
  customerOrders CustomerOrder[]
```

No `model Customer` (junto a `specialPrices`), adicionar:

```prisma
  orders CustomerOrder[]
```

No `model User` (junto às outras `@relation` nomeadas), adicionar:

```prisma
  customerOrders CustomerOrder[] @relation("CustomerOrderSalesRep")
```

No `model ProductVariant` (junto às outras relações), adicionar:

```prisma
  orderLines CustomerOrderLine[]
```

- [ ] **Step 3: Criar e aplicar a migration (requer DB dev a correr)**

Run: `cd backend && pnpm db:migrate:dev --name orders_draft`
Expected: cria `backend/prisma/migrations/<timestamp>_orders_draft/` e aplica sem erros; regenera o Prisma Client.

- [ ] **Step 4: Confirmar que o cliente Prisma reconhece os tipos novos**

Run: `pnpm -C backend typecheck`
Expected: PASS (sem erros; os tipos `CustomerOrder`, `CustomerOrderLine`, `OrderStatusHistory`, `OrderStatus` existem).

- [ ] **Step 5: Commit**

```bash
git add backend/prisma/schema.prisma backend/prisma/migrations
git commit -m "feat(orders): schema CustomerOrder/Line/StatusHistory + enum OrderStatus"
```

---

## Task 2: Domínio — recompute-totals (TDD)

**Files:**

- Create: `backend/src/domain/orders/recompute-totals.ts`
- Test: `backend/src/domain/orders/recompute-totals.test.ts`

- [ ] **Step 1: Escrever o teste que falha**

```ts
// backend/src/domain/orders/recompute-totals.test.ts
import { describe, expect, it } from 'vitest';

import { recomputeTotals } from './recompute-totals.js';

describe('recomputeTotals', () => {
  it('soma vazia → tudo zero', () => {
    expect(recomputeTotals([])).toEqual({ subtotalEur: 0, vatEur: 0, totalEur: 0 });
  });

  it('uma linha com IVA 23%', () => {
    const r = recomputeTotals([{ lineTotalEur: 100, vatPct: 23 }]);
    expect(r).toEqual({ subtotalEur: 100, vatEur: 23, totalEur: 123 });
  });

  it('várias linhas somam e arredondam a 2 casas', () => {
    const r = recomputeTotals([
      { lineTotalEur: 33.33, vatPct: 23 },
      { lineTotalEur: 10.1, vatPct: 23 },
    ]);
    // IVA por linha: 7.6659→7.67 e 2.323→2.32
    expect(r).toEqual({ subtotalEur: 43.43, vatEur: 9.99, totalEur: 53.42 });
  });

  it('IVA 0 → total = subtotal', () => {
    const r = recomputeTotals([{ lineTotalEur: 50, vatPct: 0 }]);
    expect(r).toEqual({ subtotalEur: 50, vatEur: 0, totalEur: 50 });
  });
});
```

- [ ] **Step 2: Correr para confirmar que falha**

Run: `pnpm -C backend test recompute-totals`
Expected: FAIL com "Cannot find module './recompute-totals.js'" ou "recomputeTotals is not a function".

- [ ] **Step 3: Implementar o mínimo**

```ts
// backend/src/domain/orders/recompute-totals.ts
/**
 * Recálculo de totais de uma encomenda a partir das linhas.
 * Puro: não toca em Prisma. `lineTotalEur` é o snapshot ex-IVA (já com desconto).
 * IVA calculado por linha e arredondado a 2 casas, depois somado (§9: totais no servidor).
 */
export interface OrderLineForTotals {
  lineTotalEur: number;
  vatPct: number;
}

export interface OrderTotals {
  subtotalEur: number;
  vatEur: number;
  totalEur: number;
}

export function recomputeTotals(lines: OrderLineForTotals[]): OrderTotals {
  let subtotal = 0;
  let vat = 0;
  for (const line of lines) {
    const net = round2(line.lineTotalEur);
    subtotal += net;
    vat += round2(net * (line.vatPct / 100));
  }
  const subtotalEur = round2(subtotal);
  const vatEur = round2(vat);
  return { subtotalEur, vatEur, totalEur: round2(subtotalEur + vatEur) };
}

function round2(v: number): number {
  return Math.round(v * 100) / 100;
}
```

- [ ] **Step 4: Correr para confirmar que passa**

Run: `pnpm -C backend test recompute-totals`
Expected: PASS (4 testes).

- [ ] **Step 5: Commit**

```bash
git add backend/src/domain/orders/recompute-totals.ts backend/src/domain/orders/recompute-totals.test.ts
git commit -m "feat(orders): função pura recomputeTotals com testes"
```

---

## Task 3: Domínio — order-number (TDD)

**Files:**

- Create: `backend/src/domain/orders/order-number.ts`
- Test: `backend/src/domain/orders/order-number.test.ts`

- [ ] **Step 1: Escrever o teste que falha**

```ts
// backend/src/domain/orders/order-number.test.ts
import { describe, expect, it } from 'vitest';

import { buildOrderNumber } from './order-number.js';

describe('buildOrderNumber', () => {
  it('formata com padding a 4 dígitos', () => {
    expect(buildOrderNumber(2026, 1)).toBe('ENC-2026-0001');
  });

  it('não trunca seq com 4+ dígitos', () => {
    expect(buildOrderNumber(2026, 1234)).toBe('ENC-2026-1234');
    expect(buildOrderNumber(2026, 12345)).toBe('ENC-2026-12345');
  });
});
```

- [ ] **Step 2: Correr para confirmar que falha**

Run: `pnpm -C backend test order-number`
Expected: FAIL com "Cannot find module './order-number.js'".

- [ ] **Step 3: Implementar o mínimo**

```ts
// backend/src/domain/orders/order-number.ts
/** Número legível de encomenda: ENC-{ano}-{seq zero-padded a 4}. */
export function buildOrderNumber(year: number, seq: number): string {
  return `ENC-${year}-${String(seq).padStart(4, '0')}`;
}
```

- [ ] **Step 4: Correr para confirmar que passa**

Run: `pnpm -C backend test order-number`
Expected: PASS (2 testes).

- [ ] **Step 5: Commit**

```bash
git add backend/src/domain/orders/order-number.ts backend/src/domain/orders/order-number.test.ts
git commit -m "feat(orders): função pura buildOrderNumber com testes"
```

---

## Task 4: Schemas Zod

**Files:**

- Create: `backend/src/modules/orders/orders.schemas.ts`

- [ ] **Step 1: Escrever os schemas**

```ts
// backend/src/modules/orders/orders.schemas.ts
import { z } from 'zod';

export const OrderStatusEnum = z.enum([
  'DRAFT',
  'PENDING_CONFIRMATION',
  'CONFIRMED',
  'PICKING',
  'PACKED',
  'SHIPPED',
  'DELIVERED',
  'CANCELLED',
  'RETURN_REQUESTED',
  'RETURN_RECEIVED',
  'REFUNDED',
  'REPLACED',
]);

/** Linha de input: variant + qty, com override de preço opcional (validado contra floor). */
export const orderLineInputSchema = z
  .object({
    variantId: z.string().min(1),
    qty: z.number().int().positive(),
    override: z.coerce.number().positive().optional(),
  })
  .strict();

export const createOrderSchema = z
  .object({
    customerId: z.string().min(1),
    notes: z.string().max(2000).optional(),
    requestedDeliveryDate: z.coerce.date().optional(),
    shippingAddress: z.record(z.unknown()).optional(),
    lines: z.array(orderLineInputSchema).max(200).optional(),
  })
  .strict();

export const updateOrderSchema = z
  .object({
    notes: z.string().max(2000).nullable().optional(),
    requestedDeliveryDate: z.coerce.date().nullable().optional(),
    shippingAddress: z.record(z.unknown()).nullable().optional(),
  })
  .strict();

export const addOrderLineSchema = orderLineInputSchema;

export const updateOrderLineSchema = z
  .object({
    qty: z.number().int().positive().optional(),
    override: z.coerce.number().positive().nullable().optional(),
  })
  .strict()
  .refine((v) => v.qty !== undefined || v.override !== undefined, {
    message: 'Indique qty e/ou override.',
  });

export const listOrdersQuerySchema = z
  .object({
    status: OrderStatusEnum.optional(),
    customerId: z.string().min(1).optional(),
    take: z.coerce.number().int().min(1).max(100).default(50),
    skip: z.coerce.number().int().min(0).default(0),
  })
  .strict();

export type OrderLineInput = z.infer<typeof orderLineInputSchema>;
export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type UpdateOrderInput = z.infer<typeof updateOrderSchema>;
export type AddOrderLineInput = z.infer<typeof addOrderLineSchema>;
export type UpdateOrderLineInput = z.infer<typeof updateOrderLineSchema>;
export type ListOrdersQuery = z.infer<typeof listOrdersQuerySchema>;
```

- [ ] **Step 2: Confirmar typecheck**

Run: `pnpm -C backend typecheck`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add backend/src/modules/orders/orders.schemas.ts
git commit -m "feat(orders): schemas Zod de input"
```

---

## Task 5: Repository (leituras)

**Files:**

- Create: `backend/src/modules/orders/orders.repository.ts`

- [ ] **Step 1: Escrever o repository**

```ts
// backend/src/modules/orders/orders.repository.ts
/**
 * Orders repository — leituras Prisma do módulo, todas multi-tenant.
 * Os writes transacionais (create/update/delete) vivem no service via
 * prisma.$transaction, seguindo o padrão de customersService/pricingService.
 */
import type { Prisma } from '@prisma/client';

import { prisma } from '../../db/index.js';

export interface ListOrdersFilters {
  organizationId: string;
  status?: Prisma.CustomerOrderWhereInput['status'];
  customerId?: string;
  salesRepId?: string;
  take: number;
  skip: number;
}

const customerSelect = {
  select: { id: true, legalName: true, tradingName: true },
} as const;

const lineInclude = {
  include: {
    variant: { select: { id: true, sku: true, label: true, productId: true } },
  },
} as const;

export const ordersRepository = {
  async list(filters: ListOrdersFilters) {
    const where: Prisma.CustomerOrderWhereInput = {
      organizationId: filters.organizationId,
      ...(filters.status ? { status: filters.status } : {}),
      ...(filters.customerId ? { customerId: filters.customerId } : {}),
      ...(filters.salesRepId ? { salesRepId: filters.salesRepId } : {}),
    };
    const [items, total] = await Promise.all([
      prisma.customerOrder.findMany({
        where,
        include: { customer: customerSelect, _count: { select: { lines: true } } },
        orderBy: { createdAt: 'desc' },
        take: filters.take,
        skip: filters.skip,
      }),
      prisma.customerOrder.count({ where }),
    ]);
    return { items, total };
  },

  findByIdWithLines(organizationId: string, id: string) {
    return prisma.customerOrder.findFirst({
      where: { id, organizationId },
      include: { customer: customerSelect, lines: lineInclude },
    });
  },

  findLineById(organizationId: string, id: string) {
    return prisma.customerOrderLine.findFirst({ where: { id, organizationId } });
  },

  /** Conta encomendas da org criadas no ano (para o seq do orderNumber). */
  countInYear(
    client: Prisma.TransactionClient | typeof prisma,
    organizationId: string,
    year: number,
  ): Promise<number> {
    return client.customerOrder.count({
      where: {
        organizationId,
        createdAt: { gte: new Date(Date.UTC(year, 0, 1)), lt: new Date(Date.UTC(year + 1, 0, 1)) },
      },
    });
  },
};

export type OrderWithLines = NonNullable<
  Awaited<ReturnType<typeof ordersRepository.findByIdWithLines>>
>;
```

- [ ] **Step 2: Confirmar typecheck**

Run: `pnpm -C backend typecheck`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add backend/src/modules/orders/orders.repository.ts
git commit -m "feat(orders): repository de leituras multi-tenant"
```

---

## Task 6: Service (regras de negócio)

**Files:**

- Create: `backend/src/modules/orders/orders.service.ts`

- [ ] **Step 1: Escrever o service**

```ts
// backend/src/modules/orders/orders.service.ts
/**
 * Orders service — CRUD de encomendas em DRAFT (§10.14, fatia 1).
 *
 * Invariantes:
 *   - multi-tenant: todas as queries por ctx.orgId.
 *   - snapshots de preço por linha via pricingService.resolve (floor incluído).
 *   - totais recalculados no servidor a cada mutação (§9).
 *   - ABAC: SALES_REP só vê/edita encomendas dos seus clientes.
 *   - mutações só em DRAFT → ConflictError('ORDER_NOT_EDITABLE').
 *   - orderNumber: retry em loop externo à transação (P2002 aborta a tx no Postgres).
 */
import type { Prisma } from '@prisma/client';

import { prisma } from '../../db/index.js';
import { recomputeTotals } from '../../domain/orders/recompute-totals.js';
import { buildOrderNumber } from '../../domain/orders/order-number.js';
import type { AuthContext } from '../../middlewares/auth-context.js';
import { ConflictError, ForbiddenError, NotFoundError } from '../../shared/errors.js';
import { hasAnyRole } from '../../shared/rbac.js';
import { writeAudit } from '../audit/audit.service.js';
import { pricingService } from '../pricing/pricing.service.js';

import { ordersRepository, type OrderWithLines } from './orders.repository.js';
import type {
  AddOrderLineInput,
  CreateOrderInput,
  ListOrdersQuery,
  UpdateOrderInput,
  UpdateOrderLineInput,
} from './orders.schemas.js';

/** IVA snapshot da fatia 1. TODO(orders): IVA intracomunitário / isenção art.14 — fatia futura. */
const ORDER_VAT_PCT = 23;
const ORDER_NUMBER_MAX_ATTEMPTS = 5;

export interface ResolvedLine {
  variantId: string;
  qty: number;
  unitPriceEur: number;
  discountPct: number;
  vatPct: number;
  lineTotalEur: number;
  priceSource: string;
}

export function scopeForRole(ctx: AuthContext): { salesRepId?: string } {
  if (hasAnyRole(ctx.role, ['SALES_MANAGER', 'ADMIN', 'OWNER'])) return {};
  if (ctx.role === 'SALES_REP') return { salesRepId: ctx.actorId };
  return {};
}

export function assertDraft(order: { status: string }): void {
  if (order.status !== 'DRAFT') {
    throw new ConflictError('ORDER_NOT_EDITABLE', 'Só encomendas em DRAFT podem ser alteradas.', {
      status: order.status,
    });
  }
}

export const ordersService = {
  list(ctx: AuthContext, query: ListOrdersQuery) {
    const scope = scopeForRole(ctx);
    return ordersRepository.list({
      organizationId: ctx.orgId,
      take: query.take,
      skip: query.skip,
      ...(query.status ? { status: query.status } : {}),
      ...(query.customerId ? { customerId: query.customerId } : {}),
      ...(scope.salesRepId ? { salesRepId: scope.salesRepId } : {}),
    });
  },

  async getById(ctx: AuthContext, id: string): Promise<OrderWithLines> {
    const order = await ordersRepository.findByIdWithLines(ctx.orgId, id);
    if (!order) throw new NotFoundError('ORDER_NOT_FOUND');
    if (ctx.role === 'SALES_REP' && order.salesRepId !== ctx.actorId) {
      throw new ForbiddenError('ORDER_NOT_ASSIGNED_TO_REP');
    }
    return order;
  },

  async create(ctx: AuthContext, input: CreateOrderInput): Promise<OrderWithLines> {
    const customer = await prisma.customer.findFirst({
      where: { id: input.customerId, organizationId: ctx.orgId, deletedAt: null },
      select: { id: true, salesRepId: true, status: true },
    });
    if (!customer) throw new NotFoundError('CUSTOMER_NOT_FOUND');
    if (ctx.role === 'SALES_REP' && customer.salesRepId !== ctx.actorId) {
      throw new ForbiddenError('CUSTOMER_NOT_ASSIGNED_TO_REP');
    }
    if (customer.status === 'BLOCKED') throw new ForbiddenError('CUSTOMER_BLOCKED');

    const resolvedLines = await resolveLines(ctx, customer.id, input.lines ?? []);
    assertNoDuplicateVariants(resolvedLines);
    const totals = recomputeTotals(resolvedLines);
    const orderSalesRepId = customer.salesRepId ?? ctx.actorId;

    let lastErr: unknown;
    for (let attempt = 0; attempt < ORDER_NUMBER_MAX_ATTEMPTS; attempt++) {
      try {
        const id = await persistNewOrder(ctx, {
          customerId: customer.id,
          salesRepId: orderSalesRepId,
          totals,
          resolvedLines,
          header: input,
        });
        await writeAudit(ctx, 'customer_order', id, 'CREATE', {
          customerId: customer.id,
          lines: resolvedLines.length,
          totalEur: totals.totalEur,
        });
        return this.getById(ctx, id);
      } catch (err) {
        if (isUniqueViolation(err)) {
          lastErr = err;
          continue;
        }
        throw err;
      }
    }
    throw new ConflictError('ORDER_NUMBER_COLLISION', 'Falha a gerar orderNumber único.', {
      attempts: ORDER_NUMBER_MAX_ATTEMPTS,
      cause: String(lastErr),
    });
  },

  async updateHeader(
    ctx: AuthContext,
    id: string,
    input: UpdateOrderInput,
  ): Promise<OrderWithLines> {
    const order = await this.getById(ctx, id);
    assertDraft(order);
    await prisma.customerOrder.update({
      where: { id },
      data: {
        ...(input.notes !== undefined ? { notes: input.notes } : {}),
        ...(input.requestedDeliveryDate !== undefined
          ? { requestedDeliveryDate: input.requestedDeliveryDate }
          : {}),
        ...(input.shippingAddress !== undefined
          ? { shippingAddress: jsonOrNull(input.shippingAddress) }
          : {}),
      },
    });
    await writeAudit(ctx, 'customer_order', id, 'UPDATE', input);
    return this.getById(ctx, id);
  },

  async delete(ctx: AuthContext, id: string): Promise<void> {
    const order = await this.getById(ctx, id);
    assertDraft(order);
    await prisma.customerOrder.delete({ where: { id } });
    await writeAudit(ctx, 'customer_order', id, 'DELETE');
  },

  async addLine(
    ctx: AuthContext,
    orderId: string,
    input: AddOrderLineInput,
  ): Promise<OrderWithLines> {
    const order = await this.getById(ctx, orderId);
    assertDraft(order);
    if (order.lines.some((l) => l.variantId === input.variantId)) {
      throw new ConflictError('ORDER_LINE_DUPLICATE', 'Variant já presente na encomenda.', {
        variantId: input.variantId,
      });
    }
    const [resolved] = await resolveLines(ctx, order.customerId, [input]);
    await prisma.$transaction(async (tx) => {
      await tx.customerOrderLine.create({
        data: { organizationId: ctx.orgId, orderId, ...lineData(resolved!) },
      });
      await recomputeAndPersist(tx, ctx.orgId, orderId);
    });
    await writeAudit(ctx, 'customer_order', orderId, 'UPDATE', { addedVariant: input.variantId });
    return this.getById(ctx, orderId);
  },

  async updateLine(
    ctx: AuthContext,
    orderId: string,
    lineId: string,
    input: UpdateOrderLineInput,
  ): Promise<OrderWithLines> {
    const order = await this.getById(ctx, orderId);
    assertDraft(order);
    const existing = order.lines.find((l) => l.id === lineId);
    if (!existing) throw new NotFoundError('ORDER_LINE_NOT_FOUND');

    const qty = input.qty ?? existing.qty;
    const override = input.override ?? undefined; // null/undefined → re-resolve pelo motor
    const [resolved] = await resolveLines(ctx, order.customerId, [
      { variantId: existing.variantId, qty, ...(override != null ? { override } : {}) },
    ]);
    await prisma.$transaction(async (tx) => {
      await tx.customerOrderLine.update({ where: { id: lineId }, data: lineData(resolved!) });
      await recomputeAndPersist(tx, ctx.orgId, orderId);
    });
    await writeAudit(ctx, 'customer_order', orderId, 'UPDATE', { updatedLine: lineId });
    return this.getById(ctx, orderId);
  },

  async deleteLine(ctx: AuthContext, orderId: string, lineId: string): Promise<OrderWithLines> {
    const order = await this.getById(ctx, orderId);
    assertDraft(order);
    const existing = order.lines.find((l) => l.id === lineId);
    if (!existing) throw new NotFoundError('ORDER_LINE_NOT_FOUND');
    await prisma.$transaction(async (tx) => {
      await tx.customerOrderLine.delete({ where: { id: lineId } });
      await recomputeAndPersist(tx, ctx.orgId, orderId);
    });
    await writeAudit(ctx, 'customer_order', orderId, 'UPDATE', { removedLine: lineId });
    return this.getById(ctx, orderId);
  },
};

// ----------------------------------------------------------------------------
// Helpers internos
// ----------------------------------------------------------------------------

async function resolveLines(
  ctx: AuthContext,
  customerId: string,
  lines: { variantId: string; qty: number; override?: number }[],
): Promise<ResolvedLine[]> {
  return Promise.all(
    lines.map(async (l) => {
      const price = await pricingService.resolve(ctx, {
        variantId: l.variantId,
        qty: l.qty,
        customerId,
        ...(l.override != null ? { override: l.override } : {}),
      });
      return {
        variantId: l.variantId,
        qty: l.qty,
        unitPriceEur: price.unitPriceEur,
        discountPct: price.appliedDiscountPct,
        vatPct: ORDER_VAT_PCT,
        lineTotalEur: price.lineTotalEur,
        priceSource: price.source,
      };
    }),
  );
}

export function assertNoDuplicateVariants(lines: ResolvedLine[]): void {
  const seen = new Set<string>();
  for (const l of lines) {
    if (seen.has(l.variantId)) {
      throw new ConflictError('ORDER_LINE_DUPLICATE', 'Variant repetido nas linhas.', {
        variantId: l.variantId,
      });
    }
    seen.add(l.variantId);
  }
}

function lineData(l: ResolvedLine): {
  variantId: string;
  qty: number;
  unitPriceEur: number;
  discountPct: number;
  vatPct: number;
  lineTotalEur: number;
  priceSource: string;
} {
  return {
    variantId: l.variantId,
    qty: l.qty,
    unitPriceEur: l.unitPriceEur,
    discountPct: l.discountPct,
    vatPct: l.vatPct,
    lineTotalEur: l.lineTotalEur,
    priceSource: l.priceSource,
  };
}

async function persistNewOrder(
  ctx: AuthContext,
  args: {
    customerId: string;
    salesRepId: string;
    totals: { subtotalEur: number; vatEur: number; totalEur: number };
    resolvedLines: ResolvedLine[];
    header: CreateOrderInput;
  },
): Promise<string> {
  return prisma.$transaction(async (tx) => {
    const year = new Date().getUTCFullYear();
    const count = await ordersRepository.countInYear(tx, ctx.orgId, year);
    const order = await tx.customerOrder.create({
      data: {
        organizationId: ctx.orgId,
        orderNumber: buildOrderNumber(year, count + 1),
        customerId: args.customerId,
        salesRepId: args.salesRepId,
        status: 'DRAFT',
        subtotalEur: args.totals.subtotalEur,
        vatEur: args.totals.vatEur,
        totalEur: args.totals.totalEur,
        ...(args.header.notes !== undefined ? { notes: args.header.notes } : {}),
        ...(args.header.requestedDeliveryDate !== undefined
          ? { requestedDeliveryDate: args.header.requestedDeliveryDate }
          : {}),
        ...(args.header.shippingAddress !== undefined
          ? { shippingAddress: args.header.shippingAddress as Prisma.InputJsonValue }
          : {}),
        lines: {
          create: args.resolvedLines.map((l) => ({ organizationId: ctx.orgId, ...lineData(l) })),
        },
        history: {
          create: {
            organizationId: ctx.orgId,
            fromStatus: null,
            toStatus: 'DRAFT',
            actorId: ctx.actorId,
          },
        },
      },
    });
    return order.id;
  });
}

async function recomputeAndPersist(
  tx: Prisma.TransactionClient,
  organizationId: string,
  orderId: string,
): Promise<void> {
  const lines = await tx.customerOrderLine.findMany({ where: { organizationId, orderId } });
  const totals = recomputeTotals(
    lines.map((l) => ({ lineTotalEur: Number(l.lineTotalEur), vatPct: Number(l.vatPct) })),
  );
  await tx.customerOrder.update({ where: { id: orderId }, data: totals });
}

function jsonOrNull(
  value: Record<string, unknown> | null | undefined,
): Prisma.InputJsonValue | typeof Prisma.DbNull {
  return value == null ? Prisma.DbNull : (value as Prisma.InputJsonValue);
}

function isUniqueViolation(err: unknown): boolean {
  return typeof err === 'object' && err !== null && 'code' in err && err.code === 'P2002';
}
```

- [ ] **Step 2: Confirmar typecheck**

Run: `pnpm -C backend typecheck`
Expected: PASS. (Se `Prisma.DbNull` der erro de import, garantir `import { Prisma } from '@prisma/client'` como named value — já está.)

- [ ] **Step 3: Confirmar que os testes de domínio continuam verdes**

Run: `pnpm -C backend test orders`
Expected: PASS (recompute-totals + order-number).

- [ ] **Step 4: Commit**

```bash
git add backend/src/modules/orders/orders.service.ts
git commit -m "feat(orders): service CRUD DRAFT com snapshots, totais e ABAC"
```

---

## Task 7: Testes das guards puras do service (TDD)

Mesmo padrão de `pricing.service.test.ts` (testa `assertTransition` exportado do service): cobre as regras puras que não precisam de DB — ABAC scoping, gating DRAFT e deteção de variant duplicado.

**Files:**

- Test: `backend/src/modules/orders/orders.service.test.ts`

- [ ] **Step 1: Escrever os testes**

```ts
// backend/src/modules/orders/orders.service.test.ts
import { describe, expect, it } from 'vitest';

import { ConflictError } from '../../shared/errors.js';
import type { AuthContext } from '../../middlewares/auth-context.js';

import { assertDraft, assertNoDuplicateVariants, scopeForRole } from './orders.service.js';
import type { ResolvedLine } from './orders.service.js';

function ctx(role: AuthContext['role'], actorId = 'rep-1'): AuthContext {
  return { actorId, email: 'x@y.z', orgId: 'org-1', role };
}

function line(variantId: string): ResolvedLine {
  return {
    variantId,
    qty: 1,
    unitPriceEur: 10,
    discountPct: 0,
    vatPct: 23,
    lineTotalEur: 10,
    priceSource: 'TIER_LIST',
  };
}

describe('scopeForRole (ABAC)', () => {
  it('SALES_REP fica restrito a si próprio', () => {
    expect(scopeForRole(ctx('SALES_REP', 'rep-9'))).toEqual({ salesRepId: 'rep-9' });
  });

  it('SALES_MANAGER/ADMIN/OWNER veem tudo', () => {
    expect(scopeForRole(ctx('SALES_MANAGER'))).toEqual({});
    expect(scopeForRole(ctx('ADMIN'))).toEqual({});
    expect(scopeForRole(ctx('OWNER'))).toEqual({});
  });
});

describe('assertDraft (gating)', () => {
  it('permite DRAFT', () => {
    expect(() => assertDraft({ status: 'DRAFT' })).not.toThrow();
  });

  it('rejeita qualquer outro estado', () => {
    expect(() => assertDraft({ status: 'CONFIRMED' })).toThrowError(ConflictError);
    expect(() => assertDraft({ status: 'CANCELLED' })).toThrowError(ConflictError);
  });
});

describe('assertNoDuplicateVariants', () => {
  it('aceita variants distintos', () => {
    expect(() => assertNoDuplicateVariants([line('v1'), line('v2')])).not.toThrow();
  });

  it('rejeita variant repetido', () => {
    expect(() => assertNoDuplicateVariants([line('v1'), line('v1')])).toThrowError(ConflictError);
  });
});
```

- [ ] **Step 2: Correr para confirmar que passa**

Run: `pnpm -C backend test orders.service`
Expected: PASS (3 describes). Se o import de `scopeForRole`/`assertDraft`/`assertNoDuplicateVariants`/`ResolvedLine` falhar, confirmar que estão exportados no `orders.service.ts` (Task 6).

- [ ] **Step 3: Commit**

```bash
git add backend/src/modules/orders/orders.service.test.ts
git commit -m "test(orders): guards puras do service (ABAC, gating, duplicados)"
```

---

## Task 8: Controller

**Files:**

- Create: `backend/src/modules/orders/orders.controller.ts`

- [ ] **Step 1: Escrever o controller**

```ts
// backend/src/modules/orders/orders.controller.ts
import type { Request, Response } from 'express';

import { getCtx } from '../../middlewares/auth-context.js';

import {
  addOrderLineSchema,
  createOrderSchema,
  listOrdersQuerySchema,
  updateOrderLineSchema,
  updateOrderSchema,
} from './orders.schemas.js';
import { ordersService } from './orders.service.js';

export const ordersController = {
  async list(req: Request, res: Response): Promise<void> {
    const ctx = getCtx(req);
    const query = listOrdersQuerySchema.parse(req.query);
    res.json(await ordersService.list(ctx, query));
  },

  async getById(req: Request, res: Response): Promise<void> {
    const ctx = getCtx(req);
    res.json(await ordersService.getById(ctx, req.params.id ?? ''));
  },

  async create(req: Request, res: Response): Promise<void> {
    const ctx = getCtx(req);
    const input = createOrderSchema.parse(req.body);
    res.status(201).json(await ordersService.create(ctx, input));
  },

  async update(req: Request, res: Response): Promise<void> {
    const ctx = getCtx(req);
    const input = updateOrderSchema.parse(req.body);
    res.json(await ordersService.updateHeader(ctx, req.params.id ?? '', input));
  },

  async remove(req: Request, res: Response): Promise<void> {
    const ctx = getCtx(req);
    await ordersService.delete(ctx, req.params.id ?? '');
    res.status(204).end();
  },

  async addLine(req: Request, res: Response): Promise<void> {
    const ctx = getCtx(req);
    const input = addOrderLineSchema.parse(req.body);
    res.status(201).json(await ordersService.addLine(ctx, req.params.id ?? '', input));
  },

  async updateLine(req: Request, res: Response): Promise<void> {
    const ctx = getCtx(req);
    const input = updateOrderLineSchema.parse(req.body);
    res.json(
      await ordersService.updateLine(ctx, req.params.id ?? '', req.params.lineId ?? '', input),
    );
  },

  async deleteLine(req: Request, res: Response): Promise<void> {
    const ctx = getCtx(req);
    res.json(await ordersService.deleteLine(ctx, req.params.id ?? '', req.params.lineId ?? ''));
  },
};
```

- [ ] **Step 2: Confirmar typecheck**

Run: `pnpm -C backend typecheck`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add backend/src/modules/orders/orders.controller.ts
git commit -m "feat(orders): controller HTTP"
```

---

## Task 9: Routes + registo na app

**Files:**

- Create: `backend/src/modules/orders/orders.routes.ts`
- Modify: `backend/src/app.ts`

- [ ] **Step 1: Escrever as rotas**

```ts
// backend/src/modules/orders/orders.routes.ts
import { Router } from 'express';

import { asyncHandler } from '../../middlewares/async-handler.js';
import { requireAuth, requireRole } from '../../middlewares/auth-context.js';

import { ordersController } from './orders.controller.js';

const SALES = ['SALES_REP', 'SALES_MANAGER', 'ADMIN', 'OWNER'] as const;

export function ordersRouter(): Router {
  const router = Router();
  router.use(requireAuth());

  // Leitura: qualquer role autenticado (ABAC filtra no service).
  router.get('/', asyncHandler(ordersController.list));
  router.get('/:id', asyncHandler(ordersController.getById));

  // Mutações: roles de vendas.
  router.post('/', requireRole(...SALES), asyncHandler(ordersController.create));
  router.patch('/:id', requireRole(...SALES), asyncHandler(ordersController.update));
  router.delete('/:id', requireRole(...SALES), asyncHandler(ordersController.remove));

  router.post('/:id/lines', requireRole(...SALES), asyncHandler(ordersController.addLine));
  router.patch(
    '/:id/lines/:lineId',
    requireRole(...SALES),
    asyncHandler(ordersController.updateLine),
  );
  router.delete(
    '/:id/lines/:lineId',
    requireRole(...SALES),
    asyncHandler(ordersController.deleteLine),
  );

  return router;
}
```

- [ ] **Step 2: Registar em `app.ts`**

Adicionar o import junto aos outros (ordem alfabética, antes de `productsRouter`):

```ts
import { ordersRouter } from './modules/orders/orders.routes.js';
```

Adicionar o mount junto aos outros (a seguir a `/api/leads`):

```ts
app.use('/api/orders', ordersRouter());
```

- [ ] **Step 3: Confirmar typecheck + build**

Run: `pnpm -C backend typecheck && pnpm -C backend build`
Expected: PASS (compila e gera `dist/`).

- [ ] **Step 4: Commit**

```bash
git add backend/src/modules/orders/orders.routes.ts backend/src/app.ts
git commit -m "feat(orders): rotas /api/orders e registo na app"
```

---

## Task 10: Verificação final

**Files:** nenhum (verificação).

- [ ] **Step 1: Suite de testes completa do backend**

Run: `pnpm -C backend test`
Expected: PASS (incluindo os 6 testes novos de domínio de orders).

- [ ] **Step 2: Typecheck + lint + build**

Run: `pnpm -C backend typecheck && pnpm -C backend lint && pnpm -C backend build`
Expected: PASS nos três.

- [ ] **Step 3: Smoke manual opcional (com DB dev + sessão)**

Criar uma encomenda DRAFT com uma linha e confirmar snapshots/totais:

```bash
# substituir <cookie> por uma sessão válida e <customerId>/<variantId> reais
curl -s -X POST http://localhost:3000/api/orders \
  -H 'Content-Type: application/json' -H 'Cookie: <cookie>' \
  -d '{"customerId":"<customerId>","lines":[{"variantId":"<variantId>","qty":10}]}' | jq
```

Expected: 201 com `orderNumber` `ENC-2026-0001`, `status:"DRAFT"`, linha com `unitPriceEur`/`priceSource`, e `totalEur === subtotalEur + vatEur`.

- [ ] **Step 4: Atualizar phase gate / fechar fatia**

Sem commit de código. Reportar ao utilizador que a fatia 1 está completa e perguntar se avança para a fatia 2 (FSM + reservas) — `phase_gate: true`.

---

## Notas de execução

- **Imports ESM**: sempre com extensão `.js` mesmo em ficheiros `.ts` (NodeNext).
- **PATCH de linha re-resolve o preço**: passar `qty` apenas re-resolve pelo motor (special/tier); para manter um preço manual, reenviar `override`. (Snapshot guarda `priceSource`, não o valor de override.)
- **Erros propagados do pricing**: `PRICE_BELOW_FLOOR` (400) quando `override` < floor; `VARIANT_NOT_FOUND` (404); `PRICE_NOT_FOUND` (404) se não houver special/tier line aplicável e sem override.
- **Fora de âmbito** (fatia 2+): transições de FSM, reserva/release de stock, crédito, fatura, devoluções, frontend.

```

```
