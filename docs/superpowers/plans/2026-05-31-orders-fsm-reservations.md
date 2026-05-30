# Encomendas — Fatia 2: FSM (núcleo) + reservas de stock — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) ou superpowers:executing-plans para implementar task-a-task. Os passos usam checkbox (`- [ ]`).

**Goal:** Adicionar transições de estado à `CustomerOrder` no núcleo comercial (`DRAFT → PENDING_CONFIRMATION → CONFIRMED`, `CANCELLED` a partir de qualquer um), com motor de FSM genérico, `OrderStatusHistory` em uso, e reserva/RELEASE atómicos de stock no armazém default.

**Architecture:** Motor de FSM puro em `domain/orders/order-fsm.ts` (tabela reduzida ao âmbito honrado). Endpoint único `PATCH /api/orders/:id/status` → `ordersService.transition()`, que numa só `$transaction` aplica o efeito de stock + grava history. Reserva atómica reusa o core de `stockService` extraído para primitivas tx-aware (`reserveWithinTx`/`releaseWithinTx`); os métodos públicos passam a wrappers.

**Tech Stack:** TypeScript (ESM, `.js` nos imports), Prisma 5 + Postgres, Express, Zod `.strict()`, Vitest. Comandos: `pnpm -C backend test`, `pnpm -C backend typecheck`, `pnpm -C backend lint`, `pnpm -C backend build`. **Sem migration** (enum `OrderStatus` e `OrderStatusHistory` já existem da fatia 1). DB de dev a correr para o smoke (`supabase_db_crm-florista-b2b`).

---

## Ficheiros

- Criar: `backend/src/domain/orders/order-fsm.ts` — FSM pura (tabela + guards).
- Criar: `backend/src/domain/orders/order-fsm.test.ts`
- Modificar: `backend/src/modules/stock/stock.repository.ts` — `findDefaultLocation`, `findActiveReservesForRef`.
- Modificar: `backend/src/modules/stock/stock.service.ts` — extrair `reserveWithinTx`/`releaseWithinTx`; `reserve`/`release` viram wrappers.
- Modificar: `backend/src/modules/orders/orders.schemas.ts` — `transitionOrderSchema`.
- Modificar: `backend/src/modules/orders/orders.service.ts` — `transition()` + helpers.
- Modificar: `backend/src/modules/orders/orders.controller.ts` — `transition`.
- Modificar: `backend/src/modules/orders/orders.routes.ts` — `PATCH /:id/status`.

> Nota de cobertura: a guard de FSM é testada por inteiro em `order-fsm.test.ts` (domínio puro). Não se duplica em `orders.service.test.ts` (DRY). A reserva atómica não tem teste automático nesta fatia (decisão aceite) — coberta por smoke manual na Task 8.

---

## Task 1: Domínio — motor de FSM (TDD)

**Files:**

- Create: `backend/src/domain/orders/order-fsm.ts`
- Test: `backend/src/domain/orders/order-fsm.test.ts`

- [ ] **Step 1: Escrever o teste que falha**

```ts
// backend/src/domain/orders/order-fsm.test.ts
import { describe, expect, it } from 'vitest';

import { ValidationError } from '../../shared/errors.js';

import { assertTransition, isValidOrderTransition } from './order-fsm.js';

describe('isValidOrderTransition (âmbito fatia 2)', () => {
  it('aceita as transições do núcleo comercial', () => {
    expect(isValidOrderTransition('DRAFT', 'PENDING_CONFIRMATION')).toBe(true);
    expect(isValidOrderTransition('DRAFT', 'CANCELLED')).toBe(true);
    expect(isValidOrderTransition('PENDING_CONFIRMATION', 'CONFIRMED')).toBe(true);
    expect(isValidOrderTransition('PENDING_CONFIRMATION', 'CANCELLED')).toBe(true);
    expect(isValidOrderTransition('CONFIRMED', 'CANCELLED')).toBe(true);
  });

  it('rejeita saltos inválidos', () => {
    expect(isValidOrderTransition('DRAFT', 'CONFIRMED')).toBe(false);
    expect(isValidOrderTransition('CONFIRMED', 'DRAFT')).toBe(false);
  });

  it('rejeita transições fora do âmbito desta fatia (fulfilment/devoluções)', () => {
    expect(isValidOrderTransition('CONFIRMED', 'PICKING')).toBe(false);
    expect(isValidOrderTransition('PACKED', 'SHIPPED')).toBe(false);
    expect(isValidOrderTransition('SHIPPED', 'DELIVERED')).toBe(false);
  });

  it('estados terminais e sem aresta não permitem nada', () => {
    expect(isValidOrderTransition('CANCELLED', 'DRAFT')).toBe(false);
    expect(isValidOrderTransition('PICKING', 'PACKED')).toBe(false);
  });
});

describe('assertTransition', () => {
  it('não lança em transição válida', () => {
    expect(() => assertTransition('DRAFT', 'PENDING_CONFIRMATION')).not.toThrow();
  });

  it('lança ValidationError em transição inválida', () => {
    expect(() => assertTransition('DRAFT', 'CONFIRMED')).toThrowError(ValidationError);
    expect(() => assertTransition('CANCELLED', 'CONFIRMED')).toThrowError(ValidationError);
  });
});
```

- [ ] **Step 2: Correr para confirmar que falha**

Run: `pnpm -C backend test order-fsm`
Expected: FAIL com "Cannot find module './order-fsm.js'".

- [ ] **Step 3: Implementar o mínimo**

```ts
// backend/src/domain/orders/order-fsm.ts
/**
 * FSM de CustomerOrder (§7.4, §10.14 few-shot 3).
 *
 * Tabela DELIBERADAMENTE reduzida às transições cujo efeito de stock já está
 * implementado nesta fatia. A tabela cresce por fatia até à forma canónica:
 * NÃO adicionar uma aresta sem adicionar o handler de efeito correspondente
 * (ex.: SHIPPED só entra com a conversão RESERVE→OUT). Invariante:
 * "transição válida ≡ transição honrada".
 */
import { ValidationError } from '../../shared/errors.js';

export type OrderStatus =
  | 'DRAFT'
  | 'PENDING_CONFIRMATION'
  | 'CONFIRMED'
  | 'PICKING'
  | 'PACKED'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'RETURN_REQUESTED'
  | 'RETURN_RECEIVED'
  | 'REFUNDED'
  | 'REPLACED';

const ORDER_TRANSITIONS: Partial<Record<OrderStatus, OrderStatus[]>> = {
  DRAFT: ['PENDING_CONFIRMATION', 'CANCELLED'],
  PENDING_CONFIRMATION: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['CANCELLED'], // PICKING+ entram na fatia 3, com os efeitos de stock
  CANCELLED: [],
};

export function isValidOrderTransition(from: OrderStatus, to: OrderStatus): boolean {
  return (ORDER_TRANSITIONS[from] ?? []).includes(to);
}

export function assertTransition(from: OrderStatus, to: OrderStatus): void {
  if (!isValidOrderTransition(from, to)) {
    throw new ValidationError('INVALID_ORDER_TRANSITION', 'Transição de estado inválida.', {
      from,
      to,
    });
  }
}
```

- [ ] **Step 4: Correr para confirmar que passa**

Run: `pnpm -C backend test order-fsm`
Expected: PASS (2 describes, 6 testes).

- [ ] **Step 5: Commit**

```bash
git add backend/src/domain/orders/order-fsm.ts backend/src/domain/orders/order-fsm.test.ts
git commit -m "feat(orders): motor de FSM (núcleo comercial) com guards"
```

---

## Task 2: Stock repository — leituras para reserva de encomenda

**Files:**

- Modify: `backend/src/modules/stock/stock.repository.ts`

- [ ] **Step 1: Adicionar `StockMovementRefType` ao import de tipos**

Substituir a linha de import de tipos (atualmente):

```ts
import type { Prisma, StockLevel, StockLocation, StockMovement } from '@prisma/client';
```

por:

```ts
import type {
  Prisma,
  StockLevel,
  StockLocation,
  StockMovement,
  StockMovementRefType,
} from '@prisma/client';
```

- [ ] **Step 2: Adicionar os dois métodos ao objeto `stockRepository`**

Inserir antes do fecho `};` do objeto `stockRepository` (a seguir a `findReleaseForReserve`):

```ts
  /** Armazém default e ativo da org (para reservar encomendas). */
  findDefaultLocation(organizationId: string): Promise<StockLocation | null> {
    return prisma.stockLocation.findFirst({
      where: { organizationId, isDefault: true, active: true },
    });
  },

  /**
   * Reservas (RESERVE) de um ref (ex.: ORDER/orderId) ainda NÃO libertadas.
   * Convenção de RELEASE: `reason = "released:<reserveId>"`. Diferença em JS
   * (não precisa de FOR UPDATE — o lock acontece no releaseWithinTx).
   */
  async findActiveReservesForRef(
    tx: Prisma.TransactionClient,
    organizationId: string,
    refType: StockMovementRefType,
    refId: string,
  ): Promise<StockMovement[]> {
    const [reserves, releases] = await Promise.all([
      tx.stockMovement.findMany({
        where: { organizationId, kind: 'RESERVE', refType, refId },
      }),
      tx.stockMovement.findMany({
        where: { organizationId, kind: 'RELEASE', refType, refId },
      }),
    ]);
    const released = new Set(
      releases
        .map((r) => r.reason?.replace('released:', ''))
        .filter((id): id is string => Boolean(id)),
    );
    return reserves.filter((r) => !released.has(r.id));
  },
```

- [ ] **Step 3: Confirmar typecheck**

Run: `pnpm -C backend typecheck`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add backend/src/modules/stock/stock.repository.ts
git commit -m "feat(stock): findDefaultLocation + findActiveReservesForRef"
```

---

## Task 3: Stock service — extrair primitivas tx-aware (refactor mecânico)

**Files:**

- Modify: `backend/src/modules/stock/stock.service.ts`

> Extração mecânica: o corpo do callback de `$transaction` de `reserve`/`release` move-se intacto para funções que recebem `tx`; os métodos públicos passam a wrappers. Sem mudança de comportamento nem de contrato HTTP. (Não há testes unitários de stock; a verificação é typecheck + leitura + smoke na Task 8.)

- [ ] **Step 1: Adicionar as duas funções exportadas tx-aware no topo do módulo**

A seguir aos imports e ANTES de `export const stockService = {`, adicionar:

```ts
export interface ReserveWithinTxInput {
  variantId: string;
  locationId: string;
  qty: number;
  refType: StockMovement['refType'];
  refId: string;
}

/**
 * Reserva atómica DENTRO de uma transação existente (§10.13 few-shot 1).
 * Caller é responsável por validar variant/location antes de abrir a tx.
 */
export async function reserveWithinTx(
  tx: Prisma.TransactionClient,
  ctx: AuthContext,
  input: ReserveWithinTxInput,
): Promise<{ movement: StockMovement; level: StockLevel }> {
  await stockRepository.ensureLevel(tx, ctx.orgId, input.variantId, input.locationId);
  const [locked] = await stockRepository.lockLevelForUpdate(
    tx,
    ctx.orgId,
    input.variantId,
    input.locationId,
  );
  if (!locked) throw new NotFoundError('STOCK_LEVEL_NOT_FOUND');
  if (locked.available < input.qty) {
    throw new ConflictError('INSUFFICIENT_STOCK', 'Stock insuficiente para reservar.', {
      requested: input.qty,
      available: locked.available,
    });
  }

  await tx.stockLevel.update({
    where: { id: locked.id },
    data: {
      available: { decrement: input.qty },
      reserved: { increment: input.qty },
    },
  });

  const movement = await tx.stockMovement.create({
    data: {
      organizationId: ctx.orgId,
      variantId: input.variantId,
      locationId: input.locationId,
      kind: 'RESERVE',
      qty: input.qty,
      refType: input.refType,
      refId: input.refId,
      actorId: ctx.actorId,
    },
  });

  await writeAudit(ctx, 'stock_movement', movement.id, 'CREATE', {
    kind: 'RESERVE',
    qty: input.qty,
    refType: input.refType,
    refId: input.refId,
  });

  const level = await tx.stockLevel.findUniqueOrThrow({ where: { id: locked.id } });
  return { movement, level };
}

/**
 * Liberta UMA reserva DENTRO de uma transação existente. Idempotente por
 * convenção: `reason = "released:<reserveId>"`. Caller passa o movimento RESERVE
 * já validado (kind === 'RESERVE').
 */
export async function releaseWithinTx(
  tx: Prisma.TransactionClient,
  ctx: AuthContext,
  reserve: StockMovement,
): Promise<{ movement: StockMovement; level: StockLevel }> {
  const existing = await stockRepository.findReleaseForReserve(tx, ctx.orgId, reserve.id);
  if (existing.length > 0) {
    throw new ConflictError('RESERVATION_ALREADY_RELEASED');
  }

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
    data: {
      available: { increment: reserve.qty },
      reserved: { decrement: reserve.qty },
    },
  });

  const movement = await tx.stockMovement.create({
    data: {
      organizationId: ctx.orgId,
      variantId: reserve.variantId,
      locationId: reserve.locationId,
      kind: 'RELEASE',
      qty: reserve.qty,
      refType: reserve.refType,
      refId: reserve.refId,
      reason: `released:${reserve.id}`,
      actorId: ctx.actorId,
    },
  });

  await writeAudit(ctx, 'stock_movement', movement.id, 'CREATE', {
    kind: 'RELEASE',
    reserveId: reserve.id,
    qty: reserve.qty,
  });

  const level = await tx.stockLevel.findUniqueOrThrow({ where: { id: locked.id } });
  return { movement, level };
}
```

- [ ] **Step 2: Reduzir o método público `reserve` a um wrapper**

Substituir TODO o corpo atual de `reserve` (de `async reserve(` até ao seu `},` final) por:

```ts
  /**
   * Reserva atómica com SELECT … FOR UPDATE (§10.13 few-shot 1).
   */
  async reserve(
    ctx: AuthContext,
    input: ReserveStockInput,
  ): Promise<{ movement: StockMovement; level: StockLevel }> {
    await assertVariantAndLocation(ctx, input.variantId, input.locationId);
    return prisma.$transaction((tx) =>
      reserveWithinTx(tx, ctx, {
        variantId: input.variantId,
        locationId: input.locationId,
        qty: input.qty,
        refType: input.refType,
        refId: input.refId,
      }),
    );
  },
```

- [ ] **Step 3: Reduzir o método público `release` a um wrapper**

Substituir TODO o corpo atual de `release` (de `async release(` até ao seu `},` final) por:

```ts
  /**
   * Liberta uma reserva. Idempotência por convenção: `reason = "released:<reserveId>"`.
   */
  async release(
    ctx: AuthContext,
    reserveMovementId: string,
  ): Promise<{ movement: StockMovement; level: StockLevel }> {
    const reserve = await stockRepository.findMovementById(ctx.orgId, reserveMovementId);
    if (!reserve) throw new NotFoundError('STOCK_MOVEMENT_NOT_FOUND');
    if (reserve.kind !== 'RESERVE') {
      throw new ValidationError(
        'STOCK_MOVEMENT_NOT_RESERVE',
        'Apenas movimentos kind=RESERVE podem ser libertados.',
      );
    }
    return prisma.$transaction((tx) => releaseWithinTx(tx, ctx, reserve));
  },
```

- [ ] **Step 4: Confirmar typecheck + build**

Run: `pnpm -C backend typecheck && pnpm -C backend build`
Expected: PASS (sem erros). `ReserveStockInput.refId` é `string` (obrigatório no schema de reserva); confirmar que continua a compilar.

- [ ] **Step 5: Commit**

```bash
git add backend/src/modules/stock/stock.service.ts
git commit -m "refactor(stock): extrai reserveWithinTx/releaseWithinTx; públicos viram wrappers"
```

---

## Task 4: Schema Zod da transição

**Files:**

- Modify: `backend/src/modules/orders/orders.schemas.ts`

- [ ] **Step 1: Adicionar o schema no fim do ficheiro (antes do bloco de `export type`)**

```ts
export const transitionOrderSchema = z
  .object({
    to: OrderStatusEnum,
    reason: z.string().max(500).optional(),
  })
  .strict();
```

- [ ] **Step 2: Adicionar o tipo inferido ao bloco de exports de tipos**

```ts
export type TransitionOrderInput = z.infer<typeof transitionOrderSchema>;
```

- [ ] **Step 3: Confirmar typecheck**

Run: `pnpm -C backend typecheck`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add backend/src/modules/orders/orders.schemas.ts
git commit -m "feat(orders): schema Zod de transição de estado"
```

---

## Task 5: Service — `transition()`

**Files:**

- Modify: `backend/src/modules/orders/orders.service.ts`

- [ ] **Step 1: Acrescentar imports**

Adicionar ao bloco de imports (respeitando a ordem alfabética dentro de cada grupo):

```ts
import { assertTransition } from '../../domain/orders/order-fsm.js';
import { ValidationError } from '../../shared/errors.js'; // juntar a ConflictError/ForbiddenError/NotFoundError
import { reserveWithinTx, releaseWithinTx } from '../stock/stock.service.js';
import { stockRepository } from '../stock/stock.repository.js';
```

Nota: a linha de erros existente é
`import { ConflictError, ForbiddenError, NotFoundError } from '../../shared/errors.js';`
— passa a incluir `ValidationError`:
`import { ConflictError, ForbiddenError, NotFoundError, ValidationError } from '../../shared/errors.js';`
E acrescentar `TransitionOrderInput` ao bloco de tipos importado de `./orders.schemas.js`.

- [ ] **Step 2: Adicionar o método `transition` ao objeto `ordersService`**

Inserir a seguir ao método `deleteLine` (antes do fecho `};` do objeto):

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
      } else if (input.to === 'CANCELLED' && order.status === 'CONFIRMED') {
        await releaseOrderReserves(tx, ctx, order.id);
      }
      await tx.customerOrder.update({ where: { id }, data: { status: input.to } });
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

- [ ] **Step 3: Adicionar os helpers internos (secção de helpers, a seguir a `recomputeAndPersist`)**

```ts
async function reserveOrderLines(
  tx: Prisma.TransactionClient,
  ctx: AuthContext,
  order: OrderWithLines,
): Promise<void> {
  if (order.lines.length === 0) {
    throw new ValidationError(
      'ORDER_HAS_NO_LINES',
      'Não é possível confirmar uma encomenda sem linhas.',
    );
  }
  const location = await stockRepository.findDefaultLocation(ctx.orgId);
  if (!location) {
    throw new ConflictError('NO_DEFAULT_LOCATION', 'A organização não tem armazém default ativo.');
  }
  for (const line of order.lines) {
    await reserveWithinTx(tx, ctx, {
      variantId: line.variantId,
      locationId: location.id,
      qty: line.qty,
      refType: 'ORDER',
      refId: order.id,
    });
  }
}

async function releaseOrderReserves(
  tx: Prisma.TransactionClient,
  ctx: AuthContext,
  orderId: string,
): Promise<void> {
  const reserves = await stockRepository.findActiveReservesForRef(tx, ctx.orgId, 'ORDER', orderId);
  for (const reserve of reserves) {
    await releaseWithinTx(tx, ctx, reserve);
  }
}
```

- [ ] **Step 4: Confirmar typecheck + testes de orders**

Run: `pnpm -C backend typecheck && pnpm -C backend test orders`
Expected: PASS (typecheck limpo; testes existentes de orders continuam verdes — 12 + 6 do FSM = 18).

- [ ] **Step 5: Commit**

```bash
git add backend/src/modules/orders/orders.service.ts
git commit -m "feat(orders): transition() com FSM + reserva/RELEASE atómicos e history"
```

---

## Task 6: Controller — `transition`

**Files:**

- Modify: `backend/src/modules/orders/orders.controller.ts`

- [ ] **Step 1: Acrescentar `transitionOrderSchema` ao import de schemas**

No import de `./orders.schemas.js`, juntar `transitionOrderSchema` à lista (ordem alfabética).

- [ ] **Step 2: Adicionar o handler ao objeto `ordersController`**

Inserir a seguir a `deleteLine`:

```ts
  async transition(req: Request, res: Response): Promise<void> {
    const ctx = getCtx(req);
    const input = transitionOrderSchema.parse(req.body);
    res.json(await ordersService.transition(ctx, req.params.id ?? '', input));
  },
```

- [ ] **Step 3: Confirmar typecheck**

Run: `pnpm -C backend typecheck`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add backend/src/modules/orders/orders.controller.ts
git commit -m "feat(orders): controller da transição de estado"
```

---

## Task 7: Routes — `PATCH /:id/status`

**Files:**

- Modify: `backend/src/modules/orders/orders.routes.ts`

- [ ] **Step 1: Adicionar a rota**

A seguir à rota `delete('/:id', …)` e antes das rotas de linhas, adicionar:

```ts
router.patch('/:id/status', requireRole(...SALES), asyncHandler(ordersController.transition));
```

- [ ] **Step 2: Confirmar typecheck + build**

Run: `pnpm -C backend typecheck && pnpm -C backend build`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add backend/src/modules/orders/orders.routes.ts
git commit -m "feat(orders): rota PATCH /api/orders/:id/status"
```

---

## Task 8: Verificação final + smoke manual

**Files:** nenhum (verificação).

- [ ] **Step 1: Suite completa**

Run: `pnpm -C backend test`
Expected: PASS — inclui os 6 testes novos de `order-fsm` (total esperado: 60).

- [ ] **Step 2: Typecheck + lint + build**

Run: `pnpm -C backend typecheck && pnpm -C backend lint && pnpm -C backend build`
Expected: typecheck e build PASS. Lint: os ficheiros novos/alterados sem erros; ignorar o erro pré-existente e alheio em `backend/scripts/reset-owner-password.ts` e os avisos em `tests/health.test.ts` (dívida pré-existente, fora desta fatia).

- [ ] **Step 3: Smoke manual (DB dev + sessão válida)**

Pré: encomenda DRAFT com ≥1 linha cuja variant tenha `available ≥ qty` no armazém default. Substituir `<cookie>`/`<orderId>`/`<variantId>`/`<locationId>`.

```bash
# 1. estado de stock antes
curl -s 'http://localhost:3000/api/stock/levels?variantId=<variantId>&locationId=<locationId>' -H 'Cookie: <cookie>' | jq '.items[0] | {available, reserved}'

# 2. DRAFT → PENDING_CONFIRMATION
curl -s -X PATCH http://localhost:3000/api/orders/<orderId>/status -H 'Content-Type: application/json' -H 'Cookie: <cookie>' -d '{"to":"PENDING_CONFIRMATION"}' | jq '.status'

# 3. PENDING_CONFIRMATION → CONFIRMED (reserva)
curl -s -X PATCH http://localhost:3000/api/orders/<orderId>/status -H 'Content-Type: application/json' -H 'Cookie: <cookie>' -d '{"to":"CONFIRMED"}' | jq '.status'

# 4. estado de stock depois de confirmar: available desceu qty, reserved subiu qty
curl -s 'http://localhost:3000/api/stock/levels?variantId=<variantId>&locationId=<locationId>' -H 'Cookie: <cookie>' | jq '.items[0] | {available, reserved}'

# 5. CONFIRMED → CANCELLED (RELEASE)
curl -s -X PATCH http://localhost:3000/api/orders/<orderId>/status -H 'Content-Type: application/json' -H 'Cookie: <cookie>' -d '{"to":"CANCELLED","reason":"smoke test"}' | jq '.status'

# 6. estado de stock depois de cancelar: volta ao valor do passo 1
curl -s 'http://localhost:3000/api/stock/levels?variantId=<variantId>&locationId=<locationId>' -H 'Cookie: <cookie>' | jq '.items[0] | {available, reserved}'

# 7. transição inválida → 400 INVALID_ORDER_TRANSITION
curl -s -o /dev/null -w '%{http_code}\n' -X PATCH http://localhost:3000/api/orders/<orderId>/status -H 'Content-Type: application/json' -H 'Cookie: <cookie>' -d '{"to":"CONFIRMED"}'
```

Expected: passo 3 → `"CONFIRMED"`; passo 4 mostra `available` −qty e `reserved` +qty face ao passo 1; passo 6 igual ao passo 1; passo 7 → `400` (de `CANCELLED` não há transições).

- [ ] **Step 4: Fechar fatia (phase gate)**

Sem commit de código. Reportar que a fatia 2 está completa e perguntar se avança para a fatia 3 (fulfilment `PICKING…SHIPPED` + conversão `RESERVE→OUT`) — `phase_gate: true`.

---

## Notas de execução

- **Sem migration**: nada muda no `schema.prisma`.
- **Imports ESM**: extensão `.js` mesmo em `.ts`.
- **Atomicidade**: confirmar/cancelar correm tudo numa só `$transaction`; uma linha sem stock reverte estado + todas as reservas.
- **Idempotência do RELEASE**: garantida pela convenção `reason="released:<id>"` + `findActiveReservesForRef` (que exclui reservas já libertadas).
- **Fora de âmbito** (fatia 3+): `PICKING→PACKED→SHIPPED→DELIVERED`, conversão `RESERVE→OUT`, devoluções, crédito, fatura, frontend.
