# Encomendas de Clientes — Fatia 2: FSM (núcleo) + reservas de stock

- **Data**: 2026-05-31
- **Fase**: 3 — Encomendas (§10.14, §7.4, §7.5, §10.13)
- **Âmbito desta fatia**: transições de estado da `CustomerOrder` no núcleo comercial
  (`DRAFT → PENDING_CONFIRMATION → CONFIRMED`, e `CANCELLED` a partir de qualquer um
  destes), conduzidas por um motor de FSM genérico, com `OrderStatusHistory` em uso ativo.
  Reserva atómica de stock no `CONFIRMED` (armazém default) e `RELEASE` no `CANCELLED`.
  Tudo interno, sem APIs externas.
- **Fora de âmbito (fatias seguintes)**: fulfilment (`PICKING → PACKED → SHIPPED →
DELIVERED`) e a conversão `RESERVE → OUT` no `SHIPPED`; devoluções
  (`RETURN_REQUESTED/RECEIVED/REFUNDED/REPLACED`); verificação de limite de crédito;
  fatura via provider externo; alocação multi-armazém por linha.

## Contexto

A fatia 1 fechou o CRUD de `CustomerOrder`/`CustomerOrderLine` em `DRAFT`, com snapshots de
preço e totais no servidor. O schema de encomendas (incluindo o enum `OrderStatus` completo
e a tabela `OrderStatusHistory`) já existe; a fatia 1 grava a entrada inicial de history
(`null → DRAFT`) mas não faz nenhuma transição.

A Fase 2 (Stock & Pricing) está fechada. O módulo `stock` já tem:

- `stockService.reserve(ctx, input)` e `stockService.release(ctx, reserveMovementId)`,
  ambos com `SELECT … FOR UPDATE` via `stockRepository.lockLevelForUpdate(tx, …)` e escrita
  de `StockMovement` (`kind` `RESERVE`/`RELEASE`, `qty>0`, `refType`, `refId`).
- Cada um abre a **sua própria** `prisma.$transaction`.
- `StockLevel { available, reserved, safetyStock }` com CHECK `available>=0`/`reserved>=0`.
- `StockLocation.isDefault: Boolean`.
- `StockMovementRefType.ORDER` e `StockMovementKind.{RESERVE,RELEASE,OUT,IN}`.

Peças reutilizadas: `scopeForRole(ctx)` / `assertDraft` / `getById` (ABAC) do módulo orders;
`writeAudit(ctx, entity, id, action, meta)` com `AuditAction` que já inclui `STATUS_CHANGE`.

## Decisões de arquitetura

### 1. Motor de FSM genérico, com tabela reduzida ao âmbito (deliberado)

Um único `domain/orders/order-fsm.ts` puro, no molde do §10.14 few-shot 3, mas com a tabela
de transições **limitada às arestas cujos efeitos estão implementados nesta fatia**:

```ts
const ORDER_TRANSITIONS: Partial<Record<OrderStatus, OrderStatus[]>> = {
  DRAFT: ['PENDING_CONFIRMATION', 'CANCELLED'],
  PENDING_CONFIRMATION: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['CANCELLED'], // PICKING+ entram na fatia 3
  CANCELLED: [],
};
```

**Porquê reduzida e não a tabela canónica completa:** se a tabela já permitisse
`CONFIRMED → PICKING → … → SHIPPED`, o endpoint genérico de status deixaria mover uma
encomenda até `SHIPPED` **sem** o handler de conversão `RESERVE → OUT` (que é fatia 3) —
deixando stock reservado para sempre e nunca decrementado. Mantém-se o invariante
**"transição válida ≡ transição honrada por um efeito implementado"**. A tabela cresce por
fatia até à forma canónica de §10.14. Estados fora do âmbito (`PICKING`, `SHIPPED`,
devoluções…) continuam a existir no enum, mas sem arestas — qualquer tentativa de lá chegar
dá `INVALID_ORDER_TRANSITION`.

`assertTransition(from, to)` lança `ValidationError('INVALID_ORDER_TRANSITION', { from, to })`
(§7.4). `isValidOrderTransition(from, to)` devolve booleano (consulta segura mesmo para
estados sem entrada na tabela).

### 2. Endpoint único conduzido pela FSM

```
PATCH /api/orders/:id/status     body: { to: OrderStatus, reason?: string }
```

Em vez de `/confirm` e `/cancel` separados. Roles de vendas
(`SALES_REP | SALES_MANAGER | ADMIN | OWNER`), iguais às mutações da fatia 1; ABAC reusa
`getById` (SALES_REP só a encomenda atribuída). Devolve a `OrderWithLines` atualizada.

### 3. Reserva atómica — primitivas tx-aware partilhadas (Abordagem A)

O core de `stockService.reserve`/`release` é extraído para funções que aceitam um `tx`
existente; os métodos públicos passam a wrappers de uma linha (comportamento e contrato
HTTP **inalterados**, cobertos pelos testes de stock atuais).

```ts
// modules/stock/stock.service.ts  (exportadas)
async function reserveWithinTx(
  tx,
  ctx,
  input: { variantId; locationId; qty; refType; refId },
): Promise<StockMovement>;
async function releaseWithinTx(tx, ctx, reserve: StockMovement): Promise<StockMovement>;
// reserve()/release() públicos passam a:  return prisma.$transaction((tx) => reserveWithinTx(tx, ctx, input))
```

`orders.service.transition()` abre **uma** `$transaction` e, lá dentro, aplica o efeito da
transição + grava history, tudo atómico:

- **`* → CONFIRMED`** (só de `PENDING_CONFIRMATION`):
  1. exige `order.lines.length > 0` → senão `ValidationError('ORDER_HAS_NO_LINES')`;
  2. resolve o armazém default (`stockRepository.findDefaultLocation(orgId)`) → senão
     `ConflictError('NO_DEFAULT_LOCATION')`;
  3. por cada linha, `reserveWithinTx(tx, ctx, { variantId, locationId: default, qty,
refType: 'ORDER', refId: order.id })`. `available < qty` aborta a transação inteira
     com `INSUFFICIENT_STOCK` (nenhuma linha fica reservada).
- **`CONFIRMED → CANCELLED`**: liberta todas as reservas ativas da encomenda —
  `findActiveReservesForRef(tx, orgId, 'ORDER', orderId)` e `releaseWithinTx` por cada.
- **`DRAFT|PENDING_CONFIRMATION → CANCELLED`**: sem efeito de stock (nada foi reservado).
- **`DRAFT → PENDING_CONFIRMATION`**: sem efeito de stock.

Sempre: `tx.orderStatusHistory.create({ fromStatus, toStatus, actorId, reason })` +
`writeAudit(ctx, 'customer_order', id, 'STATUS_CHANGE', { from, to, reason })`.

Uma `RESERVE` por linha (por variant), `locationId` = default, `refType=ORDER`,
`refId=order.id`. Encomenda com N linhas → N movimentos `RESERVE`.

## Componentes (ficheiros)

- **Criar** `backend/src/domain/orders/order-fsm.ts` — `ORDER_TRANSITIONS` (reduzida),
  `isValidOrderTransition`, `assertTransition`. Puro, sem imports de framework.
- **Criar** `backend/src/domain/orders/order-fsm.test.ts` — testes da guard.
- **Modificar** `backend/src/modules/stock/stock.service.ts` — extrair `reserveWithinTx` /
  `releaseWithinTx`; `reserve`/`release` passam a wrappers.
- **Modificar** `backend/src/modules/stock/stock.repository.ts` — adicionar
  `findDefaultLocation(orgId)` e `findActiveReservesForRef(tx, orgId, refType, refId)`
  (reservas sem `RELEASE` correspondente).
- **Modificar** `backend/src/modules/orders/orders.schemas.ts` — `transitionOrderSchema`
  (`{ to: OrderStatusEnum, reason?: string }`, `.strict()`).
- **Modificar** `backend/src/modules/orders/orders.service.ts` — `transition(ctx, id, input)`
  - helpers `reserveOrderLines(tx, …)` / `releaseOrderReserves(tx, …)`. Exporta a guard
    pura usada (`assertTransition` reexportado do domínio para os testes, se conveniente).
- **Modificar** `backend/src/modules/orders/orders.controller.ts` — `transition`.
- **Modificar** `backend/src/modules/orders/orders.routes.ts` — `PATCH /:id/status`.
- **Modificar** `backend/src/modules/orders/orders.service.test.ts` — testes da guard de FSM.

## Fluxo de dados (confirmar)

```
PATCH /api/orders/:id/status {to:CONFIRMED}
  controller.parse(transitionOrderSchema)
    service.transition(ctx, id, {to})
      order = getById(ctx, id)            // ABAC + NotFound
      assertTransition(order.status, to)  // FSM guard
      $transaction:
        assertHasLines(order)
        loc = findDefaultLocation(orgId)
        for line in order.lines: reserveWithinTx(tx, …)   // FOR UPDATE, decrement available
        update status = CONFIRMED
        orderStatusHistory.create(from, to, actor, reason)
      writeAudit(STATUS_CHANGE)
    return getById(ctx, id)               // OrderWithLines atualizada
```

## Tratamento de erros

| Código                     | HTTP    | Quando                                             |
| -------------------------- | ------- | -------------------------------------------------- |
| `INVALID_ORDER_TRANSITION` | 400     | `to` não está nas transições válidas de `from`.    |
| `ORDER_HAS_NO_LINES`       | 400     | Confirmar uma encomenda sem linhas.                |
| `NO_DEFAULT_LOCATION`      | 409     | Org sem `StockLocation.isDefault`.                 |
| `INSUFFICIENT_STOCK`       | 409     | `available < qty` numa linha ao reservar (reusado) |
| `ORDER_NOT_FOUND` / `…REP` | 404/403 | reusados de `getById`.                             |

## Invariantes de negócio preservados

- **Stock ≥ 0**: CHECK na DB + `available < qty` valida antes do decrement, sob
  `FOR UPDATE`.
- **Reserva atómica com a mudança de estado**: tudo numa só `$transaction`; falha de
  qualquer linha reverte estado + todas as reservas.
- **Snapshots imutáveis**: linhas só editáveis em `DRAFT` (gating da fatia 1 mantém-se);
  uma encomenda confirmada é imutável exceto no estado.
- **History regista todas as transições** (§7.4).
- **Multi-tenant + ABAC**: todas as queries por `ctx.orgId`; `getById` aplica o scope.
- **Sem `RESERVE→OUT` nem caminhos não-honrados**: garantido pela tabela de FSM reduzida.

## Estratégia de testes

- **Domínio puro (novo)**: `order-fsm.test.ts` — transições válidas e inválidas, incluindo
  estados sem aresta (`CONFIRMED→PICKING` inválido nesta fatia, `CANCELLED→*` inválido).
- **Guards do service**: estender `orders.service.test.ts` com a guard de FSM.
- **Reserva atómica (integração)**: a fatia 1 não introduziu testes de DB; mantém-se a
  abordagem — **smoke manual** no plano (confirmar uma encomenda, verificar `reserved` a
  subir e `available` a descer; cancelar e verificar o inverso) + cobertura indireta pelos
  testes de stock existentes. Ver self-critique #3.

## Fora de âmbito (confirmado)

- Fulfilment `PICKING→PACKED→SHIPPED→DELIVERED` e conversão `RESERVE→OUT`.
- Devoluções e reembolsos.
- Limite de crédito (adiado: precisa de faturas/pagamentos para definir "saldo em dívida";
  `creditLimitEur` default 0 bloquearia tudo).
- Alocação multi-armazém por linha; campo `locationId` na encomenda.
- Frontend.

## Self-critique

1. **A tabela de FSM reduzida contraria a prescrição de §10.14 (tabela completa)?**
   Tecnicamente diverge da forma literal, mas preserva um invariante mais forte: nunca
   permitir uma transição cujo efeito de stock não está implementado. A alternativa (tabela
   completa + rejeitar transições não suportadas no service) duplicaria a fonte de verdade
   das transições. A tabela cresce por fatia até à canónica; documentado no código.

2. **Um endpoint genérico de status é seguro com a tabela a crescer?** Sim — a validação é
   sempre `assertTransition`, logo adicionar arestas na fatia 3 não abre nada
   inadvertidamente; cada nova aresta entra junto com o seu handler de efeito.

3. **A reserva atómica fica sem teste automático?** A guard de FSM fica coberta; a reserva
   real só por smoke manual, o que é o ponto mais fraco — é precisamente o invariante mais
   crítico. Mitigação: o `reserveWithinTx` é o mesmo código já exercido pelos testes de
   stock; o plano deve incluir um smoke explícito. Recomenda-se, como reforço, um teste de
   integração contra a DB de dev numa iteração futura (decisão de não o fazer agora é por
   consistência com a fatia 1, não por ser desnecessário).
