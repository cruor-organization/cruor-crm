# Encomendas de Clientes — Fatia 3 (a+b): Fulfilment + conversão RESERVE→OUT + metadados de expedição

- **Data**: 2026-05-31
- **Fase**: 3 — Encomendas (§7.4, §7.5, §10.14, §10.13)
- **Âmbito desta fatia**: expandir a FSM de `CustomerOrder` com o caminho de fulfilment
  (`CONFIRMED → PICKING → PACKED → SHIPPED → DELIVERED`, e `CANCELLED` a partir de
  `CONFIRMED`/`PICKING`/`PACKED`), converter `RESERVE → OUT` no `SHIPPED`, e capturar
  metadados de expedição (transportadora + tracking + timestamps) na encomenda. Tudo interno.
- **Fora de âmbito (fatias seguintes)**: devoluções
  (`RETURN_REQUESTED/RECEIVED/REFUNDED/REPLACED`, com quarentena §10.17); verificação de limite de
  crédito; fatura via provider externo; notificação WAREHOUSE via SSE; integração real de
  etiquetas/tracking das transportadoras (Fase 6); expedições parciais (multi-shipment) e alocação
  multi-armazém por linha.

## Contexto

As fatias 1 e 2 estão completas. A fatia 1 fechou o CRUD de `CustomerOrder`/`CustomerOrderLine`
em `DRAFT` (snapshots de preço, totais no servidor). A fatia 2 introduziu o motor de FSM
(`backend/src/domain/orders/order-fsm.ts`), o endpoint único `PATCH /api/orders/:id/status`, e a
reserva atómica de stock: ao `CONFIRMED` cria-se um `StockMovement RESERVE` por linha no armazém
default (`available −qty`, `reserved +qty`, sob `SELECT … FOR UPDATE`); ao `CANCELLED` liberta-se
(`RELEASE`).

A tabela de FSM da fatia 2 está **deliberadamente reduzida** às arestas cujo efeito de stock já
existe (invariante: _"transição válida ≡ transição honrada por um efeito implementado"_). Esta
fatia cresce a tabela com o bloco de fulfilment e o respetivo efeito.

Peças reutilizadas do módulo de stock (fatia 2): `reserveWithinTx`/`releaseWithinTx` (primitivas
tx-aware exportadas de `stock.service.ts`), `stockRepository.findDefaultLocation`,
`stockRepository.findActiveReservesForRef`, `stockRepository.lockLevelForUpdate`. Do módulo de
orders: `getById` (ABAC), `assertTransition`/`isValidOrderTransition`, `transition()`,
`reserveOrderLines`/`releaseOrderReserves`, `writeAudit(…, 'STATUS_CHANGE', …)`.

A regra de negócio canónica (§7.5, §380 do prompt): _"ao confirmar, RESERVE; ao despachar,
converter em OUT; em cancelamento, RELEASE."_ A FSM canónica completa está em §10.14 few-shot 3.

## Decisões de arquitetura

### 1. FSM — expandir a tabela com o bloco de fulfilment

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

Mantém-se a tabela reduzida: as arestas de devolução (`SHIPPED→RETURN_REQUESTED`,
`DELIVERED→RETURN_REQUESTED`, `RETURN_*`) ficam fora até a fatia de devoluções trazer o efeito
`RETURN`/quarentena. Tentá-las dá `INVALID_ORDER_TRANSITION`. `SHIPPED` e `DELIVERED` não permitem
`CANCELLED` (mercadoria já saiu) — coerente com §10.14.

### 2. Efeitos de stock por transição (atómicos com o update de estado)

`ordersService.transition()` continua a abrir **uma** `$transaction` que aplica o efeito + grava
`OrderStatusHistory` + (novo) persiste os metadados de expedição. Efeitos:

- **`→CONFIRMED`** (de `PENDING_CONFIRMATION`): `reserveOrderLines` — **inalterado** (fatia 2).
- **`→SHIPPED`** (de `PACKED`): converter cada `RESERVE` ativo da encomenda em `OUT`. Nova
  primitiva em `stock.service.ts`:

  ```ts
  // shipReserveWithinTx(tx, ctx, reserve): converte UMA reserva em saída física.
  //   - lockLevelForUpdate(variant, location)  // FOR UPDATE
  //   - se locked.reserved < reserve.qty → ConflictError('RESERVATION_INCONSISTENT')
  //   - stockLevel.update: reserved -= qty   // available NÃO muda (já desceu no RESERVE)
  //   - stockMovement.create: kind=OUT, refType=reserve.refType, refId=reserve.refId,
  //                           reason="shipped:<reserveId>", qty=reserve.qty
  //   - writeAudit(stock_movement, OUT)
  ```

  Helper no service: `shipOrderReserves(tx, ctx, orderId)` —
  `findActiveReservesForRef(tx, orgId, 'ORDER', orderId)` e `shipReserveWithinTx` por cada.

- **`→CANCELLED`**: `releaseOrderReserves(tx, ctx, orderId)`. Simplifica-se a condição da fatia 2
  (`to===CANCELLED && status==='CONFIRMED'`) para **libertar em qualquer `CANCELLED`** — é no-op
  quando não há reservas ativas (DRAFT/PENDING) e passa a cobrir PICKING/PACKED sem ramos extra.
- **`→PICKING`, `→PACKED`, `→DELIVERED`**: sem efeito de stock.

**`available` nunca é re-tocado no SHIPPED.** A sequência por linha é: RESERVE (`available −qty`,
`reserved +qty`) → OUT (`reserved −qty`). Resultado físico: stock saiu, `available` desceu uma vez.
A conversão é at-most-once por estar gated pela FSM (`SHIPPED` só se alcança uma vez, de `PACKED`).

`findActiveReservesForRef` (fatia 2) exclui reservas com `RELEASE` correspondente; como nenhuma
transição em âmbito liberta uma encomenda já `SHIPPED` (a FSM bloqueia), não há risco de uma reserva
convertida em OUT ser libertada. **Refinamento defensivo** (incluído): estender
`findActiveReservesForRef` para excluir também reservas com `OUT`/`reason="shipped:<id>"`
correspondente, garantindo idempotência mesmo que futuras arestas reabram o caminho.

### 3. Metadados de expedição na `CustomerOrder` (migration)

Sem entidade `Shipment` (§7 não a prescreve; um envio por encomenda — YAGNI). Novos campos em
`customer_order` + um enum:

```prisma
enum ShipmentCarrier { CTT  DPD  CHRONOPOST  OTHER }

model CustomerOrder {
  // … campos existentes …
  carrier      ShipmentCarrier?
  trackingCode String?
  shippedAt    DateTime?
  deliveredAt  DateTime?
}
```

Preenchidos na transação: `→SHIPPED` grava `carrier`, `trackingCode`, `shippedAt = now`;
`→DELIVERED` grava `deliveredAt = now`. Os timestamps alimentam analytics futuros (receita de
encomendas DELIVERED, `Customer.lastSoldAt`).

### 4. Endpoint — estender o schema de status (Abordagem A)

Mantém-se o endpoint único `PATCH /api/orders/:id/status`; sem `/ship` dedicado. O schema ganha um
bloco de expedição condicional:

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

Regra: `shipment` presente ⇔ `to === 'SHIPPED'`.

### 5. RBAC

Acrescenta-se `WAREHOUSE` ao conjunto de roles do endpoint de status (é o ator natural de
picking/packing/shipping), juntando-se aos SALES/ADMIN/OWNER já permitidos. ABAC inalterado:
`getById` continua a restringir `SALES_REP` às suas encomendas; `WAREHOUSE`/`SALES_MANAGER`/
`ADMIN`/`OWNER` veem todas. Diferenciação de role por-transição é YAGNI nesta fatia.

## Componentes (ficheiros)

- **Modificar** `backend/prisma/schema.prisma` — enum `ShipmentCarrier`; campos `carrier`,
  `trackingCode`, `shippedAt`, `deliveredAt` em `CustomerOrder`.
- **Criar** `backend/prisma/migrations/<ts>_orders_fulfillment_shipment/migration.sql` — via
  `prisma migrate diff --script` (ambiente não-interativo), aplicada com `pnpm -C backend db:migrate`.
- **Modificar** `backend/src/domain/orders/order-fsm.ts` — expandir `ORDER_TRANSITIONS`.
- **Modificar** `backend/src/domain/orders/order-fsm.test.ts` — novas arestas válidas + devoluções
  ainda inválidas.
- **Modificar** `backend/src/modules/stock/stock.service.ts` — `shipReserveWithinTx(tx, ctx, reserve)`.
- **Modificar** `backend/src/modules/stock/stock.repository.ts` — `findActiveReservesForRef` exclui
  também reservas já convertidas em `OUT` (`shipped:<id>`).
- **Modificar** `backend/src/modules/orders/orders.schemas.ts` — `ShipmentCarrierEnum`,
  `transitionOrderSchema` com `shipment` + `superRefine`.
- **Modificar** `backend/src/modules/orders/orders.service.ts` — handler `→SHIPPED`
  (`shipOrderReserves` + persistir metadados), `→DELIVERED` (`deliveredAt`), `→CANCELLED`
  generalizado; persistência de `carrier`/`trackingCode`/`shippedAt` no update.
- **Controller/routes**: o handler `transition` já existe; só muda o role guard (`+WAREHOUSE`).

> Nota de cobertura: a guard de FSM é testada por inteiro em `order-fsm.test.ts`. A conversão
> RESERVE→OUT e a persistência de metadados são cobertas por smoke manual por script (consistente
> com fatias 1/2 — sem testes de integração de DB nesta fase).

## Fluxo de dados

```
PATCH /api/orders/:id/status {to:SHIPPED, shipment:{carrier, trackingCode}}
  controller.parse(transitionOrderSchema)        // superRefine: shipment obrigatório
    service.transition(ctx, id, input)
      order = getById(ctx, id)                    // ABAC + NotFound
      assertTransition(order.status, 'SHIPPED')   // PACKED→SHIPPED válido
      $transaction:
        shipOrderReserves(tx, ctx, order.id)      // por reserva ativa: FOR UPDATE, reserved-=qty, OUT
        customerOrder.update({ status:SHIPPED, carrier, trackingCode, shippedAt:now })
        orderStatusHistory.create(from:PACKED, to:SHIPPED, actor, reason)
      writeAudit(STATUS_CHANGE)
    return getById(ctx, id)                        // OrderWithLines atualizada
```

## Tratamento de erros

| Código                     | HTTP    | Quando                                                         |
| -------------------------- | ------- | -------------------------------------------------------------- |
| `INVALID_ORDER_TRANSITION` | 400     | `to` fora das transições válidas de `from` (inclui devoluções) |
| `SHIPMENT_REQUIRED`        | 400     | `to===SHIPPED` sem bloco `shipment` (Zod)                      |
| `SHIPMENT_NOT_ALLOWED`     | 400     | `shipment` presente com `to!==SHIPPED` (Zod)                   |
| `RESERVATION_INCONSISTENT` | 409     | `reserved < qty` ao converter uma reserva em OUT               |
| `ORDER_NOT_FOUND` / `…REP` | 404/403 | reusados de `getById`                                          |

## Invariantes de negócio preservados

- **Stock ≥ 0**: CHECK na DB + `reserved ≥ qty` validado sob `FOR UPDATE` antes do decrement.
- **OUT at-most-once por encomenda**: gated pela FSM (`SHIPPED` alcançável uma vez) + reservas já
  convertidas excluídas de `findActiveReservesForRef`.
- **`available` decrementado uma única vez** (no RESERVE); o SHIPPED só move `reserved → OUT`.
- **Efeito atómico com o estado**: conversão + update + history + metadados numa só `$transaction`;
  falha de qualquer reserva reverte tudo.
- **Snapshots imutáveis**: encomenda confirmada permanece imutável exceto estado/metadados de envio.
- **History regista todas as transições** (§7.4); **multi-tenant + ABAC** em todas as queries.

## Estratégia de testes

- **Domínio puro**: `order-fsm.test.ts` estendido — `CONFIRMED→PICKING`, `PICKING→PACKED`,
  `PACKED→SHIPPED`, `SHIPPED→DELIVERED`, `PICKING→CANCELLED`, `PACKED→CANCELLED` válidas;
  `SHIPPED→CANCELLED`, `SHIPPED→RETURN_REQUESTED`, `DELIVERED→RETURN_REQUESTED`,
  `CONFIRMED→SHIPPED` (salto) inválidas.
- **Smoke por script** (descartável, via camada de service contra a DB dev): percurso
  `DRAFT→…→CONFIRMED→PICKING→PACKED→SHIPPED` afirma `reserved −qty`, `available` inalterado face ao
  CONFIRMED, `StockMovement OUT` criado, `carrier`/`trackingCode`/`shippedAt` persistidos;
  `→DELIVERED` põe `deliveredAt`; ramo alternativo `PICKING→CANCELLED` liberta (stock ao inicial).

## Self-critique

1. **Capturar `carrier`/`trackingCode` na própria `CustomerOrder` chega, ou devia ser uma entidade
   `Shipment`?** Para um envio por encomenda (caso atual), os campos diretos são o mínimo correto e o
   §7 não prescreve `Shipment`. Expedições parciais (uma encomenda em várias remessas) exigiriam a
   entidade — está explicitamente fora de âmbito; quando surgir, migra-se os campos para `Shipment`
   com backfill 1:1. Custo de adiar: baixo.

2. **Estender o schema genérico de status com um bloco condicional de expedição não o polui?** O
   `superRefine` mantém a regra "shipment ⇔ SHIPPED" explícita e local; a alternativa (`/ship`
   dedicado) duplicaria validação FSM/history/audit. O acoplamento é aceitável e reversível.

3. **A conversão RESERVE→OUT fica sem teste automático (só smoke)?** É o ponto mais fraco, tal como
   na fatia 2 — e é um invariante crítico. Mitigação: reusa `lockLevelForUpdate` já exercido; o smoke
   é explícito e afirma os deltas. Um teste de integração contra a DB de dev é recomendado como
   reforço numa iteração de hardening (Fase 8), não por ser dispensável.
