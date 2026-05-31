# Encomendas — Fatia 3 (a+b): Fulfilment + RESERVE→OUT + expedição — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recomendado) ou superpowers:executing-plans para implementar task-a-task. Os passos usam checkbox (`- [ ]`).

**Goal:** Expandir a FSM de `CustomerOrder` com o caminho de fulfilment (`CONFIRMED→PICKING→PACKED→SHIPPED→DELIVERED`, `CANCELLED` de PICKING/PACKED), converter `RESERVE→OUT` no SHIPPED, e capturar transportadora + tracking + timestamps na encomenda.

**Architecture:** Cresce a tabela de FSM reduzida (`domain/orders/order-fsm.ts`) com as arestas de fulfilment. O endpoint único `PATCH /api/orders/:id/status` ganha um bloco `shipment` condicional. `ordersService.transition()` aplica, numa só `$transaction`, o efeito de stock (`SHIPPED`→OUT via nova primitiva `shipReserveWithinTx`; `CANCELLED`→RELEASE) + grava history + persiste os metadados de envio. Migration adiciona o enum `ShipmentCarrier` e 4 campos a `CustomerOrder`.

**Tech Stack:** TypeScript (ESM, `.js` nos imports), Prisma 5 + Postgres, Express, Zod `.strict()`, Vitest. Comandos: `pnpm -C backend {test,typecheck,lint,build}`. **Com migration** (gerada por `prisma migrate diff --script`, ambiente sem TTY). DB de dev a correr para a migration e o smoke (`supabase_db_crm-florista-b2b`).

**Git:** trabalhar diretamente em `main`, NÃO criar branch, NÃO correr `gh pr create`. Um commit Conventional por task.

---

## Ficheiros

- Modificar: `backend/prisma/schema.prisma` — enum `ShipmentCarrier`; campos `carrier`/`trackingCode`/`shippedAt`/`deliveredAt` em `CustomerOrder`.
- Criar: `backend/prisma/migrations/20260531_orders_fulfillment_shipment/migration.sql`.
- Modificar: `backend/src/domain/orders/order-fsm.ts` — expandir `ORDER_TRANSITIONS`.
- Modificar: `backend/src/domain/orders/order-fsm.test.ts` — arestas de fulfilment válidas; devoluções/saltos ainda inválidos.
- Modificar: `backend/src/modules/stock/stock.repository.ts` — `findActiveReservesForRef` exclui também reservas já convertidas em `OUT` (`shipped:<id>`).
- Modificar: `backend/src/modules/stock/stock.service.ts` — `shipReserveWithinTx(tx, ctx, reserve)`.
- Modificar: `backend/src/modules/orders/orders.schemas.ts` — `ShipmentCarrierEnum`; `transitionOrderSchema` com `shipment` + `superRefine`.
- Modificar: `backend/src/modules/orders/orders.service.ts` — handlers `→SHIPPED`/`→DELIVERED`/`→CANCELLED`; helper `shipOrderReserves`; imports.
- Modificar: `backend/src/modules/orders/orders.routes.ts` — `WAREHOUSE` no role guard do endpoint de status.

> Nota de cobertura: a guard de FSM é testada por inteiro em `order-fsm.test.ts` (domínio puro). A conversão RESERVE→OUT e a persistência de metadados não têm teste automático nesta fatia (consistente com fatias 1/2) — cobertas por smoke por script na Task 8.

---

## Task 1: Schema + migration (enum `ShipmentCarrier` + campos de expedição)

**Files:**

- Modify: `backend/prisma/schema.prisma`
- Create: `backend/prisma/migrations/20260531_orders_fulfillment_shipment/migration.sql`

- [ ] **Step 1: Garantir a DB dev a correr**

Run:

```bash
docker start supabase_db_crm-florista-b2b >/dev/null 2>&1; \
for i in $(seq 1 15); do docker exec supabase_db_crm-florista-b2b pg_isready -U postgres >/dev/null 2>&1 && break; sleep 1; done; \
cd backend && pnpm exec prisma migrate status | tail -3
```

Expected: `Database schema is up to date!`. (Nota: o container já foi OOM-killed antes — `Exited (137)`; reiniciar é normal.)

- [ ] **Step 2: Adicionar o enum `ShipmentCarrier`**

Em `backend/prisma/schema.prisma`, a seguir ao enum `OrderStatus` (antes do bloco `model CustomerOrder`), adicionar:

```prisma
enum ShipmentCarrier {
  CTT
  DPD
  CHRONOPOST
  OTHER
}
```

- [ ] **Step 3: Adicionar os 4 campos a `CustomerOrder`**

Em `model CustomerOrder`, a seguir à linha `shippingAddress           Json?` (e antes de `createdAt`), adicionar:

```prisma
  carrier               ShipmentCarrier?
  trackingCode          String?
  shippedAt             DateTime?
  deliveredAt           DateTime?
```

- [ ] **Step 4: Gerar a migration por diff (ambiente sem TTY)**

Run (a partir de `backend/`):

```bash
mkdir -p prisma/migrations/20260531_orders_fulfillment_shipment && \
pnpm exec prisma migrate diff \
  --from-schema-datasource prisma/schema.prisma \
  --to-schema-datamodel prisma/schema.prisma \
  --script > prisma/migrations/20260531_orders_fulfillment_shipment/migration.sql && \
cat prisma/migrations/20260531_orders_fulfillment_shipment/migration.sql
```

Expected: SQL semelhante a (confirmar; se o diff falhar, escrever este conteúdo à mão):

```sql
-- CreateEnum
CREATE TYPE "ShipmentCarrier" AS ENUM ('CTT', 'DPD', 'CHRONOPOST', 'OTHER');

-- AlterTable
ALTER TABLE "customer_order" ADD COLUMN     "carrier" "ShipmentCarrier",
ADD COLUMN     "trackingCode" TEXT,
ADD COLUMN     "shippedAt" TIMESTAMP(3),
ADD COLUMN     "deliveredAt" TIMESTAMP(3);
```

- [ ] **Step 5: Aplicar a migration + regenerar o client**

Run (a partir de `backend/`):

```bash
pnpm db:migrate && pnpm db:generate
```

Expected: `migrate deploy` reporta 1 migration aplicada (`20260531_orders_fulfillment_shipment`); `prisma generate` OK.

- [ ] **Step 6: Confirmar typecheck (client tem os novos tipos)**

Run: `pnpm -C backend typecheck`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add backend/prisma/schema.prisma backend/prisma/migrations/20260531_orders_fulfillment_shipment
git commit -m "feat(orders): migration de expedição (ShipmentCarrier + carrier/tracking/shippedAt/deliveredAt)"
```

---

## Task 2: Domínio — expandir a FSM com fulfilment (TDD)

**Files:**

- Modify: `backend/src/domain/orders/order-fsm.test.ts`
- Modify: `backend/src/domain/orders/order-fsm.ts`

- [ ] **Step 1: Atualizar o teste (passa a esperar as arestas de fulfilment)**

Em `backend/src/domain/orders/order-fsm.test.ts`, substituir o bloco `describe('isValidOrderTransition (âmbito fatia 2)', …)` inteiro (linhas do `describe` até ao seu `});`) por:

```ts
describe('isValidOrderTransition (núcleo + fulfilment)', () => {
  it('aceita as transições do núcleo comercial', () => {
    expect(isValidOrderTransition('DRAFT', 'PENDING_CONFIRMATION')).toBe(true);
    expect(isValidOrderTransition('DRAFT', 'CANCELLED')).toBe(true);
    expect(isValidOrderTransition('PENDING_CONFIRMATION', 'CONFIRMED')).toBe(true);
    expect(isValidOrderTransition('PENDING_CONFIRMATION', 'CANCELLED')).toBe(true);
    expect(isValidOrderTransition('CONFIRMED', 'CANCELLED')).toBe(true);
  });

  it('aceita o caminho de fulfilment', () => {
    expect(isValidOrderTransition('CONFIRMED', 'PICKING')).toBe(true);
    expect(isValidOrderTransition('PICKING', 'PACKED')).toBe(true);
    expect(isValidOrderTransition('PACKED', 'SHIPPED')).toBe(true);
    expect(isValidOrderTransition('SHIPPED', 'DELIVERED')).toBe(true);
    expect(isValidOrderTransition('PICKING', 'CANCELLED')).toBe(true);
    expect(isValidOrderTransition('PACKED', 'CANCELLED')).toBe(true);
  });

  it('rejeita saltos inválidos', () => {
    expect(isValidOrderTransition('DRAFT', 'CONFIRMED')).toBe(false);
    expect(isValidOrderTransition('CONFIRMED', 'DRAFT')).toBe(false);
    expect(isValidOrderTransition('CONFIRMED', 'SHIPPED')).toBe(false);
  });

  it('rejeita cancelar depois de expedir', () => {
    expect(isValidOrderTransition('SHIPPED', 'CANCELLED')).toBe(false);
    expect(isValidOrderTransition('DELIVERED', 'CANCELLED')).toBe(false);
  });

  it('rejeita devoluções (fatia futura)', () => {
    expect(isValidOrderTransition('SHIPPED', 'RETURN_REQUESTED')).toBe(false);
    expect(isValidOrderTransition('DELIVERED', 'RETURN_REQUESTED')).toBe(false);
    expect(isValidOrderTransition('RETURN_REQUESTED', 'RETURN_RECEIVED')).toBe(false);
  });

  it('estados terminais não permitem nada', () => {
    expect(isValidOrderTransition('CANCELLED', 'DRAFT')).toBe(false);
    expect(isValidOrderTransition('DELIVERED', 'DRAFT')).toBe(false);
  });
});
```

- [ ] **Step 2: Correr para confirmar que falha**

Run: `pnpm -C backend test order-fsm`
Expected: FAIL — `aceita o caminho de fulfilment` falha (ex.: `CONFIRMED→PICKING` ainda devolve `false`).

- [ ] **Step 3: Expandir a tabela de transições**

Em `backend/src/domain/orders/order-fsm.ts`, substituir o objeto `ORDER_TRANSITIONS` inteiro por:

```ts
const ORDER_TRANSITIONS: Partial<Record<OrderStatus, OrderStatus[]>> = {
  DRAFT: ['PENDING_CONFIRMATION', 'CANCELLED'],
  PENDING_CONFIRMATION: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['PICKING', 'CANCELLED'],
  PICKING: ['PACKED', 'CANCELLED'],
  PACKED: ['SHIPPED', 'CANCELLED'],
  SHIPPED: ['DELIVERED'], // RETURN_REQUESTED entra na fatia de devoluções, com o efeito RETURN
  DELIVERED: [], // idem
  CANCELLED: [],
};
```

E atualizar o comentário do topo do ficheiro, trocando a frase
`CONFIRMED: ['CANCELLED'], // PICKING+ entram na fatia 3, com os efeitos de stock`
(se existir no JSDoc) por uma menção a que o bloco de fulfilment já está honrado e que as devoluções entram na fatia seguinte. (Cosmético; não falha testes.)

- [ ] **Step 4: Correr para confirmar que passa**

Run: `pnpm -C backend test order-fsm`
Expected: PASS (2 describes; 8 testes).

- [ ] **Step 5: Commit**

```bash
git add backend/src/domain/orders/order-fsm.ts backend/src/domain/orders/order-fsm.test.ts
git commit -m "feat(orders): FSM aceita o caminho de fulfilment (CONFIRMED→…→DELIVERED)"
```

---

## Task 3: Stock repository — excluir reservas já expedidas (OUT)

**Files:**

- Modify: `backend/src/modules/stock/stock.repository.ts`

> `shipReserveWithinTx` (Task 4) grava o `OUT` com `reason = "shipped:<reserveId>"`. Tal como o `RELEASE` (`released:<id>`), uma reserva convertida em OUT deixa de estar "ativa". Refinamento defensivo: garante idempotência se uma futura aresta reabrir o caminho.

- [ ] **Step 1: Substituir o corpo de `findActiveReservesForRef`**

Em `backend/src/modules/stock/stock.repository.ts`, substituir o método `findActiveReservesForRef` inteiro (de `async findActiveReservesForRef(` até ao seu `},` final) por:

```ts
  /**
   * Reservas (RESERVE) de um ref (ex.: ORDER/orderId) ainda ATIVAS — sem `RELEASE`
   * nem `OUT` correspondente. Convenções: RELEASE `reason="released:<id>"`,
   * OUT de expedição `reason="shipped:<id>"`. Diferença em JS (o lock é feito
   * no release/ship WithinTx).
   */
  async findActiveReservesForRef(
    tx: Prisma.TransactionClient,
    organizationId: string,
    refType: StockMovementRefType,
    refId: string,
  ): Promise<StockMovement[]> {
    const [reserves, consumers] = await Promise.all([
      tx.stockMovement.findMany({
        where: { organizationId, kind: 'RESERVE', refType, refId },
      }),
      tx.stockMovement.findMany({
        where: { organizationId, kind: { in: ['RELEASE', 'OUT'] }, refType, refId },
      }),
    ]);
    const consumed = new Set(
      consumers
        .map((r) => r.reason?.replace(/^(released|shipped):/, ''))
        .filter((id): id is string => Boolean(id)),
    );
    return reserves.filter((r) => !consumed.has(r.id));
  },
```

- [ ] **Step 2: Confirmar typecheck**

Run: `pnpm -C backend typecheck`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add backend/src/modules/stock/stock.repository.ts
git commit -m "feat(stock): findActiveReservesForRef exclui reservas já expedidas (OUT)"
```

---

## Task 4: Stock service — `shipReserveWithinTx` (RESERVE→OUT)

**Files:**

- Modify: `backend/src/modules/stock/stock.service.ts`

> Espelha `releaseWithinTx`, mas: `kind='OUT'`, decrementa **só** `reserved` (o `available` já desceu no RESERVE), `reason="shipped:<reserveId>"`.

- [ ] **Step 1: Adicionar a função exportada a seguir a `releaseWithinTx`**

Em `backend/src/modules/stock/stock.service.ts`, a seguir ao fecho da função `releaseWithinTx` (antes de `export const stockService = {`), adicionar:

```ts
/**
 * Converte UMA reserva em saída física (RESERVE→OUT) DENTRO de uma transação
 * existente. Usado ao despachar (§7.5, §380). `available` NÃO muda — já foi
 * decrementado no RESERVE; aqui só desce `reserved`. Convenção: `reason="shipped:<reserveId>"`.
 */
export async function shipReserveWithinTx(
  tx: Prisma.TransactionClient,
  ctx: AuthContext,
  reserve: StockMovement,
): Promise<{ movement: StockMovement; level: StockLevel }> {
  const [locked] = await stockRepository.lockLevelForUpdate(
    tx,
    ctx.orgId,
    reserve.variantId,
    reserve.locationId,
  );
  if (!locked) throw new NotFoundError('STOCK_LEVEL_NOT_FOUND');
  if (locked.reserved < reserve.qty) {
    throw new ConflictError('RESERVATION_INCONSISTENT', 'Reserved < qty da reserva.', {
      reserved: locked.reserved,
      required: reserve.qty,
    });
  }

  await tx.stockLevel.update({
    where: { id: locked.id },
    data: { reserved: { decrement: reserve.qty } },
  });

  const movement = await tx.stockMovement.create({
    data: {
      organizationId: ctx.orgId,
      variantId: reserve.variantId,
      locationId: reserve.locationId,
      kind: 'OUT',
      qty: reserve.qty,
      refType: reserve.refType,
      refId: reserve.refId,
      reason: `shipped:${reserve.id}`,
      actorId: ctx.actorId,
    },
  });

  await writeAudit(ctx, 'stock_movement', movement.id, 'CREATE', {
    kind: 'OUT',
    reserveId: reserve.id,
    qty: reserve.qty,
  });

  const level = await tx.stockLevel.findUniqueOrThrow({ where: { id: locked.id } });
  return { movement, level };
}
```

- [ ] **Step 2: Confirmar typecheck + build**

Run: `pnpm -C backend typecheck && pnpm -C backend build`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add backend/src/modules/stock/stock.service.ts
git commit -m "feat(stock): shipReserveWithinTx converte RESERVE em OUT (despacho)"
```

---

## Task 5: Schema Zod — `shipment` condicional na transição

**Files:**

- Modify: `backend/src/modules/orders/orders.schemas.ts`

- [ ] **Step 1: Adicionar `ShipmentCarrierEnum` a seguir a `OrderStatusEnum`**

Em `backend/src/modules/orders/orders.schemas.ts`, a seguir ao fecho de `OrderStatusEnum` (`]);`), adicionar:

```ts
export const ShipmentCarrierEnum = z.enum(['CTT', 'DPD', 'CHRONOPOST', 'OTHER']);
```

- [ ] **Step 2: Substituir `transitionOrderSchema` pelo schema com `shipment`**

Substituir o bloco atual `export const transitionOrderSchema = z.object({ … }).strict();` por:

```ts
export const transitionOrderSchema = z
  .object({
    to: OrderStatusEnum,
    reason: z.string().max(500).optional(),
    shipment: z
      .object({
        carrier: ShipmentCarrierEnum,
        trackingCode: z.string().min(1).max(120),
      })
      .strict()
      .optional(),
  })
  .strict()
  .superRefine((v, ctx) => {
    if (v.to === 'SHIPPED' && !v.shipment) {
      ctx.addIssue({ code: 'custom', message: 'SHIPMENT_REQUIRED', path: ['shipment'] });
    }
    if (v.to !== 'SHIPPED' && v.shipment) {
      ctx.addIssue({ code: 'custom', message: 'SHIPMENT_NOT_ALLOWED', path: ['shipment'] });
    }
  });
```

O `export type TransitionOrderInput = z.infer<typeof transitionOrderSchema>;` existente mantém-se — passa a incluir `shipment` automaticamente.

- [ ] **Step 3: Confirmar typecheck**

Run: `pnpm -C backend typecheck`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add backend/src/modules/orders/orders.schemas.ts
git commit -m "feat(orders): bloco shipment condicional no schema de transição"
```

---

## Task 6: Service — efeitos de fulfilment em `transition()`

**Files:**

- Modify: `backend/src/modules/orders/orders.service.ts`

- [ ] **Step 1: Acrescentar `shipReserveWithinTx` ao import de stock.service**

Em `backend/src/modules/orders/orders.service.ts`, a linha atual:

```ts
import { releaseWithinTx, reserveWithinTx } from '../stock/stock.service.js';
```

passa a:

```ts
import { releaseWithinTx, reserveWithinTx, shipReserveWithinTx } from '../stock/stock.service.js';
```

- [ ] **Step 2: Substituir o corpo do método `transition`**

Substituir o método `async transition(…) { … },` inteiro (de `async transition(` até ao `},` que o fecha) por:

```ts
  async transition(
    ctx: AuthContext,
    id: string,
    input: TransitionOrderInput,
  ): Promise<OrderWithLines> {
    const order = await this.getById(ctx, id);
    assertTransition(order.status, input.to);

    await prisma.$transaction(async (tx) => {
      if (input.to === 'CONFIRMED') {
        await reserveOrderLines(tx, ctx, order);
      } else if (input.to === 'SHIPPED') {
        await shipOrderReserves(tx, ctx, order.id);
      } else if (input.to === 'CANCELLED') {
        await releaseOrderReserves(tx, ctx, order.id);
      }
      await tx.customerOrder.update({
        where: { id },
        data: {
          status: input.to,
          ...(input.to === 'SHIPPED' && input.shipment
            ? {
                carrier: input.shipment.carrier,
                trackingCode: input.shipment.trackingCode,
                shippedAt: new Date(),
              }
            : {}),
          ...(input.to === 'DELIVERED' ? { deliveredAt: new Date() } : {}),
        },
      });
      await tx.orderStatusHistory.create({
        data: {
          organizationId: ctx.orgId,
          orderId: id,
          fromStatus: order.status,
          toStatus: input.to,
          actorId: ctx.actorId,
          ...(input.reason !== undefined ? { reason: input.reason } : {}),
        },
      });
    });

    await writeAudit(ctx, 'customer_order', id, 'STATUS_CHANGE', {
      from: order.status,
      to: input.to,
      ...(input.reason !== undefined ? { reason: input.reason } : {}),
    });
    return this.getById(ctx, id);
  },
```

> Nota: a condição de RELEASE deixa de ser `&& order.status === 'CONFIRMED'` — passa a libertar em qualquer `CANCELLED` (no-op se não houver reservas ativas; cobre CONFIRMED/PICKING/PACKED).

- [ ] **Step 3: Adicionar o helper `shipOrderReserves` a seguir a `releaseOrderReserves`**

Na secção de helpers (a seguir ao fecho `}` da função `releaseOrderReserves`), adicionar:

```ts
async function shipOrderReserves(
  tx: Prisma.TransactionClient,
  ctx: AuthContext,
  orderId: string,
): Promise<void> {
  const reserves = await stockRepository.findActiveReservesForRef(tx, ctx.orgId, 'ORDER', orderId);
  for (const reserve of reserves) {
    await shipReserveWithinTx(tx, ctx, reserve);
  }
}
```

- [ ] **Step 4: Confirmar typecheck + testes de orders**

Run: `pnpm -C backend typecheck && pnpm -C backend test orders`
Expected: PASS (typecheck limpo; testes de orders + FSM continuam verdes).

- [ ] **Step 5: Commit**

```bash
git add backend/src/modules/orders/orders.service.ts
git commit -m "feat(orders): transition() despacha (RESERVE→OUT), regista expedição e generaliza RELEASE"
```

---

## Task 7: Routes — `WAREHOUSE` no endpoint de status

**Files:**

- Modify: `backend/src/modules/orders/orders.routes.ts`

> O controller (`ordersController.transition`) já faz `transitionOrderSchema.parse` — não muda. Só o role guard do endpoint de status passa a incluir `WAREHOUSE` (ator de picking/packing/shipping). As restantes mutações continuam só com `SALES`.

- [ ] **Step 1: Adicionar a constante de roles de fulfilment**

Em `backend/src/modules/orders/orders.routes.ts`, a seguir à linha:

```ts
const SALES = ['SALES_REP', 'SALES_MANAGER', 'ADMIN', 'OWNER'] as const;
```

adicionar:

```ts
const STATUS_ROLES = [...SALES, 'WAREHOUSE'] as const;
```

- [ ] **Step 2: Usar `STATUS_ROLES` na rota de status**

Substituir a linha:

```ts
router.patch('/:id/status', requireRole(...SALES), asyncHandler(ordersController.transition));
```

por:

```ts
router.patch(
  '/:id/status',
  requireRole(...STATUS_ROLES),
  asyncHandler(ordersController.transition),
);
```

- [ ] **Step 3: Confirmar typecheck + build**

Run: `pnpm -C backend typecheck && pnpm -C backend build`
Expected: PASS. (Se `requireRole` tipar os args como `AppRole`, confirmar que `'WAREHOUSE'` é um `AppRole` válido — é, está no enum de roles.)

- [ ] **Step 4: Commit**

```bash
git add backend/src/modules/orders/orders.routes.ts
git commit -m "feat(orders): WAREHOUSE pode conduzir transições de fulfilment"
```

---

## Task 8: Verificação final + smoke por script

**Files:**

- Create (descartável, removido no fim): `backend/scripts/smoke-orders-fulfillment.ts`

- [ ] **Step 1: Suite completa + typecheck + build**

Run: `pnpm -C backend test && pnpm -C backend typecheck && pnpm -C backend build`
Expected: PASS — `order-fsm` com 8 testes; total ≥ 62.

- [ ] **Step 2: Lint (sem regressões novas)**

Run: `pnpm -C backend lint`
Expected: o ÚNICO erro é o pré-existente e alheio `backend/scripts/reset-owner-password.ts` (+ 2 avisos em `tests/health.test.ts`). Os ficheiros desta fatia não acrescentam erros/avisos. (O smoke novo em `scripts/` também não passa pelo project-service do ESLint — corre por `tsx`, não por lint, e é removido no fim.)

- [ ] **Step 3: Garantir a DB dev a correr**

Run:

```bash
docker start supabase_db_crm-florista-b2b >/dev/null 2>&1; \
for i in $(seq 1 15); do docker exec supabase_db_crm-florista-b2b pg_isready -U postgres >/dev/null 2>&1 && break; sleep 1; done; echo ready
```

- [ ] **Step 4: Escrever o smoke**

Criar `backend/scripts/smoke-orders-fulfillment.ts` com:

```ts
/**
 * Smoke (descartável) da fatia 3 — fulfilment + RESERVE→OUT + expedição.
 * Percurso real via camada de service contra a DB dev:
 *   DRAFT→PENDING_CONFIRMATION→CONFIRMED→PICKING→PACKED→SHIPPED→DELIVERED
 * + ramo PICKING→CANCELLED (RELEASE). Semeia o mínimo e limpa no fim.
 *
 * Uso: pnpm -C backend exec tsx scripts/smoke-orders-fulfillment.ts
 */
import 'dotenv/config';

import { prisma } from '../src/db/index.js';
import type { AuthContext } from '../src/middlewares/auth-context.js';
import { ordersService } from '../src/modules/orders/orders.service.js';
import { stockService } from '../src/modules/stock/stock.service.js';

const QTY = 10;
let pass = 0;
let fail = 0;

function check(label: string, cond: boolean, extra?: unknown): void {
  if (cond) {
    pass++;
    console.log(`  ✓ ${label}`);
  } else {
    fail++;
    console.error(`  ✗ ${label}`, extra ?? '');
  }
}

async function level(variantId: string, locationId: string) {
  const lvl = await prisma.stockLevel.findUnique({
    where: { variantId_locationId: { variantId, locationId } },
    select: { available: true, reserved: true },
  });
  return lvl ?? { available: 0, reserved: 0 };
}

async function seed(ctx: AuthContext, tag: string) {
  let location = await prisma.stockLocation.findFirst({
    where: { organizationId: ctx.orgId, isDefault: true, active: true },
  });
  let createdLocationId: string | undefined;
  if (!location) {
    location = await prisma.stockLocation.create({
      data: {
        organizationId: ctx.orgId,
        code: tag,
        name: `Armazém ${tag}`,
        country: 'PT',
        isDefault: true,
        active: true,
      },
    });
    createdLocationId = location.id;
  }
  const product = await prisma.product.create({
    data: {
      organizationId: ctx.orgId,
      sku: `P-${tag}`,
      name: `Produto ${tag}`,
      slug: `p-${tag.toLowerCase()}`,
      category: 'DRY_FLOWERS',
      costEur: 1.0,
    },
  });
  const variant = await prisma.productVariant.create({
    data: {
      organizationId: ctx.orgId,
      productId: product.id,
      sku: `V-${tag}`,
      label: 'Smoke',
      costEur: 1.0,
      isDefault: true,
    },
  });
  await stockService.createMovement(ctx, {
    variantId: variant.id,
    locationId: location.id,
    kind: 'IN',
    qty: 100,
    refType: 'ADJUSTMENT',
  } as Parameters<typeof stockService.createMovement>[1]);
  const customer = await prisma.customer.create({
    data: {
      organizationId: ctx.orgId,
      businessType: 'PHYSICAL_SHOP',
      legalName: `Florista ${tag}`,
      pricingTier: 'STANDARD',
      status: 'ACTIVE',
    },
  });
  return { location, product, variant, customer, createdLocationId };
}

async function runHappyPath(ctx: AuthContext, tag: string): Promise<string[]> {
  const ids: string[] = [];
  const { location, product, variant, customer, createdLocationId } = await seed(ctx, tag);
  const order = await ordersService.create(ctx, {
    customerId: customer.id,
    lines: [{ variantId: variant.id, qty: QTY, override: 10.0 }],
  });
  ids.push(order.id);
  const before = await level(variant.id, location.id);

  await ordersService.transition(ctx, order.id, { to: 'PENDING_CONFIRMATION' });
  await ordersService.transition(ctx, order.id, { to: 'CONFIRMED' });
  const afterConfirm = await level(variant.id, location.id);
  check(
    `CONFIRMED reserva ${QTY}`,
    afterConfirm.available === before.available - QTY &&
      afterConfirm.reserved === before.reserved + QTY,
    afterConfirm,
  );

  await ordersService.transition(ctx, order.id, { to: 'PICKING' });
  await ordersService.transition(ctx, order.id, { to: 'PACKED' });
  const afterPack = await level(variant.id, location.id);
  check(
    'PICKING/PACKED não mexem no stock',
    afterPack.available === afterConfirm.available && afterPack.reserved === afterConfirm.reserved,
    afterPack,
  );

  const shipped = await ordersService.transition(ctx, order.id, {
    to: 'SHIPPED',
    shipment: { carrier: 'CTT', trackingCode: `TRK-${tag}` },
  });
  check(
    'SHIPPED grava carrier/trackingCode/shippedAt',
    shipped.carrier === 'CTT' && Boolean(shipped.trackingCode) && Boolean(shipped.shippedAt),
    {
      carrier: shipped.carrier,
      trackingCode: shipped.trackingCode,
      shippedAt: shipped.shippedAt,
    },
  );
  const afterShip = await level(variant.id, location.id);
  check(
    `SHIPPED converte RESERVE→OUT: reserved −${QTY}, available inalterado`,
    afterShip.reserved === afterConfirm.reserved - QTY &&
      afterShip.available === afterConfirm.available,
    afterShip,
  );
  const out = await prisma.stockMovement.count({
    where: { organizationId: ctx.orgId, kind: 'OUT', refType: 'ORDER', refId: order.id },
  });
  check('existe StockMovement OUT para a encomenda', out === 1, { out });

  const delivered = await ordersService.transition(ctx, order.id, { to: 'DELIVERED' });
  check('DELIVERED grava deliveredAt', Boolean(delivered.deliveredAt), delivered.deliveredAt);

  const history = await prisma.orderStatusHistory.findMany({
    where: { organizationId: ctx.orgId, orderId: order.id },
    orderBy: { createdAt: 'asc' },
    select: { toStatus: true },
  });
  check(
    'history regista o percurso completo',
    history.map((h) => h.toStatus).join('→') ===
      'DRAFT→PENDING_CONFIRMATION→CONFIRMED→PICKING→PACKED→SHIPPED→DELIVERED',
    history.map((h) => h.toStatus).join('→'),
  );

  // guardar refs para cleanup
  (runHappyPath as unknown as { _refs: unknown })._refs = {
    productId: product.id,
    variantId: variant.id,
    customerId: customer.id,
    createdLocationId,
  };
  return ids;
}

async function runCancelBranch(ctx: AuthContext, tag: string): Promise<string[]> {
  const ids: string[] = [];
  const { location, product, variant, customer, createdLocationId } = await seed(ctx, tag);
  const order = await ordersService.create(ctx, {
    customerId: customer.id,
    lines: [{ variantId: variant.id, qty: QTY, override: 10.0 }],
  });
  ids.push(order.id);
  const before = await level(variant.id, location.id);
  await ordersService.transition(ctx, order.id, { to: 'PENDING_CONFIRMATION' });
  await ordersService.transition(ctx, order.id, { to: 'CONFIRMED' });
  await ordersService.transition(ctx, order.id, { to: 'PICKING' });
  await ordersService.transition(ctx, order.id, { to: 'CANCELLED', reason: 'smoke' });
  const after = await level(variant.id, location.id);
  check(
    'CANCELLED de PICKING liberta a reserva (stock ao inicial)',
    after.available === before.available && after.reserved === before.reserved,
    after,
  );
  (runCancelBranch as unknown as { _refs: unknown })._refs = {
    productId: product.id,
    variantId: variant.id,
    customerId: customer.id,
    createdLocationId,
  };
  return ids;
}

async function cleanup(
  ctx: AuthContext,
  orderIds: string[],
  refsList: Array<{
    productId: string;
    variantId: string;
    customerId: string;
    createdLocationId?: string;
  }>,
): Promise<void> {
  for (const orderId of orderIds) {
    await prisma.stockMovement
      .deleteMany({ where: { refType: 'ORDER', refId: orderId } })
      .catch(() => {});
    await prisma.orderStatusHistory.deleteMany({ where: { orderId } }).catch(() => {});
    await prisma.customerOrderLine.deleteMany({ where: { orderId } }).catch(() => {});
    await prisma.customerOrder.delete({ where: { id: orderId } }).catch(() => {});
  }
  for (const r of refsList) {
    await prisma.customer.delete({ where: { id: r.customerId } }).catch(() => {});
    await prisma.stockMovement.deleteMany({ where: { variantId: r.variantId } }).catch(() => {});
    await prisma.stockLevel.deleteMany({ where: { variantId: r.variantId } }).catch(() => {});
    await prisma.productVariant.delete({ where: { id: r.variantId } }).catch(() => {});
    await prisma.product.delete({ where: { id: r.productId } }).catch(() => {});
    if (r.createdLocationId)
      await prisma.stockLocation.delete({ where: { id: r.createdLocationId } }).catch(() => {});
  }
}

async function main(): Promise<void> {
  const member = await prisma.member.findFirst({
    select: { userId: true, organizationId: true },
  });
  if (!member) throw new Error('Sem membros na DB — não dá para construir AuthContext.');
  const user = await prisma.user.findUnique({
    where: { id: member.userId },
    select: { email: true },
  });
  const ctx: AuthContext = {
    actorId: member.userId,
    email: user?.email ?? 'smoke@local',
    orgId: member.organizationId,
    role: 'OWNER',
  };

  const stamp = Date.now();
  const orderIds: string[] = [];
  const refsList: Array<{
    productId: string;
    variantId: string;
    customerId: string;
    createdLocationId?: string;
  }> = [];
  try {
    orderIds.push(...(await runHappyPath(ctx, `SMOKE-${stamp}-A`)));
    refsList.push(
      (
        runHappyPath as unknown as {
          _refs: {
            productId: string;
            variantId: string;
            customerId: string;
            createdLocationId?: string;
          };
        }
      )._refs,
    );
    orderIds.push(...(await runCancelBranch(ctx, `SMOKE-${stamp}-B`)));
    refsList.push(
      (
        runCancelBranch as unknown as {
          _refs: {
            productId: string;
            variantId: string;
            customerId: string;
            createdLocationId?: string;
          };
        }
      )._refs,
    );
  } finally {
    await cleanup(ctx, orderIds, refsList);
    await prisma.$disconnect();
  }

  console.log(`\nRESULTADO: ${pass} passou, ${fail} falhou`);
  if (fail > 0) process.exit(1);
}

main().catch((e: unknown) => {
  console.error(e);
  process.exit(1);
});
```

- [ ] **Step 5: Correr o smoke**

Run: `pnpm -C backend exec tsx scripts/smoke-orders-fulfillment.ts 2>&1 | grep -v "prisma:query" | tail -20`
Expected: todos os checks `✓` e `RESULTADO: N passou, 0 falhou` (N ≥ 7). Se a DB cair (OOM, exit 137) a meio, repetir o Step 3 e correr de novo.

- [ ] **Step 6: Confirmar DB limpa + remover o script descartável**

Run:

```bash
docker exec supabase_db_crm-florista-b2b psql -U postgres -d postgres -tA \
  -c "SELECT (SELECT count(*) FROM product WHERE sku LIKE 'P-SMOKE-%'), (SELECT count(*) FROM customer WHERE \"legalName\" LIKE 'Florista SMOKE-%');"
rm -f backend/scripts/smoke-orders-fulfillment.ts
git status --short
```

Expected: `0|0`; `git status` volta ao baseline (sem o smoke; `backend/scripts/` continua untracked por causa do `reset-owner-password.ts` pré-existente).

- [ ] **Step 7: Fechar a fatia (phase gate)**

Sem commit de código. Reportar fatia 3a+3b completa com evidências (suite, smoke) e perguntar se avança para a fatia seguinte (3c crédito / 3d devoluções) — `phase_gate: true`.

---

## Notas de execução

- **Migration**: gerada por `prisma migrate diff --script` (sem TTY) e aplicada por `pnpm db:migrate` (deploy). Regenerar o client com `pnpm db:generate` antes do typecheck.
- **DB flaky**: o container `supabase_db_crm-florista-b2b` foi OOM-killed (`Exited (137)`) várias vezes; reiniciar com `docker start` + `pg_isready` antes da migration e do smoke.
- **Imports ESM**: extensão `.js` mesmo em `.ts`.
- **Atomicidade**: despacho/cancelamento correm tudo numa só `$transaction`; falha de uma reserva reverte estado + efeitos.
- **`available` decrementado uma só vez** (no RESERVE); SHIPPED só move `reserved → OUT`.
- **Fora de âmbito** (fatias 3c/3d+): devoluções, crédito, fatura, SSE WAREHOUSE, integração real de transportadoras, expedições parciais, frontend.

---

## Self-review (cobertura vs spec)

- §FSM (expandir tabela) → Task 2. §Efeito SHIPPED (RESERVE→OUT) → Tasks 4+6. §CANCELLED generalizado → Task 6. §Refinamento `findActiveReservesForRef` → Task 3. §Migration (enum+campos) → Task 1. §Endpoint `shipment` condicional → Task 5. §Persistência de metadados → Task 6. §RBAC WAREHOUSE → Task 7. §Erros (`RESERVATION_INCONSISTENT`, `SHIPMENT_REQUIRED/NOT_ALLOWED`, `INVALID_ORDER_TRANSITION`) → Tasks 4/5/2. §Testes (FSM) → Task 2; §Smoke → Task 8.
- Sem placeholders: todo o código está inline. Tipos consistentes: `shipReserveWithinTx`, `shipOrderReserves`, `ShipmentCarrierEnum`, `STATUS_ROLES` usados com a mesma assinatura em que são definidos.
