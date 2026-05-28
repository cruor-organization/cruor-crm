# Encomendas de Clientes — Fatia 1: CRUD em DRAFT

- **Data**: 2026-05-28
- **Fase**: 3 — Encomendas (§10.14, §7.4, §7.5)
- **Âmbito desta fatia**: schema do domínio de encomendas + CRUD de `CustomerOrder` e
  respetivas linhas, limitado ao estado `DRAFT`. Sem transições de FSM, sem reserva de
  stock, sem fatura. Tudo interno, sem APIs externas.
- **Fatias seguintes (fora de âmbito)**: FSM completa + `OrderStatusHistory` em uso +
  reserva atómica de stock no `CONFIRMED` + conversão `reserve→OUT` no `SHIPPED` +
  verificação de limite de crédito (fatia 2/3); fatura via provider externo e devoluções
  (fatia posterior).

## Contexto

A Fase 2 (Stock & Pricing) está fechada. Existem os módulos `customers`, `products`,
`stock`, `pricing` com o molde `routes → controller → service → repository → schemas`

- teste. Não existe modelo de dados de encomendas: o Prisma pára em
  `CustomerSpecialPrice`. Esta fatia introduz o núcleo de encomendas pelo CRUD mais
  simples e isolado.

Peças reutilizadas:

- `pricingService.resolve(ctx, input)` → `ResolvedPrice` (`unitPriceEur`,
  `appliedDiscountPct`, `lineTotalEur`, `source`) com floor (`cost × 1.10`) já validado
  e suporte a `override`.
- `scopeForRole(ctx)` (padrão ABAC dos `customers`): `{ salesRepId }` para `SALES_REP`,
  `{}` para `SALES_MANAGER`/`ADMIN`/`OWNER`.
- `writeAudit(ctx, entity, id, action, meta)`.
- `StockMovementRefType.ORDER` já existe (será usado na fatia 2).

## Decisão de arquitetura

**Resolução de preço por linha reutiliza `pricingService.resolve` (Abordagem A).**
O order service chama `pricingService.resolve(ctx, { variantId, qty, customerId,
override })` por linha e mapeia o `ResolvedPrice` para os campos snapshot. Zero
duplicação; floor garantido pelo motor existente. Em `DRAFT` o facto de `resolve` fazer
reads próprios (não tx-aware) é irrelevante. Quando a fatia 3 exigir revalidação dentro
da transação de reserva, promove-se para um `resolveLinePrice(tx, …)` partilhado
(Abordagem B). Não se faz agora (YAGNI).

## Modelo de dados (migration aditiva)

O enum `OrderStatus` é definido **completo** já agora (12 estados), embora a fatia 1 só
use `DRAFT` — evita uma migration extra para adicionar valores de enum no Postgres.
`CustomerOrderLine` e `OrderStatusHistory` nascem já, porque snapshot e histórico são
invariantes do domínio, não features da fatia 2.

### `enum OrderStatus` (§7.4 / §10.14 few-shot 3)

```
DRAFT, PENDING_CONFIRMATION, CONFIRMED, PICKING, PACKED, SHIPPED, DELIVERED,
CANCELLED, RETURN_REQUESTED, RETURN_RECEIVED, REFUNDED, REPLACED
```

### `model CustomerOrder`

| Campo                     | Tipo          | Notas                                                                   |
| ------------------------- | ------------- | ----------------------------------------------------------------------- |
| `id`                      | String cuid   | PK                                                                      |
| `organizationId`          | String        | multi-tenant; FK Organization (cascade)                                 |
| `orderNumber`             | String        | legível, ex. `ENC-2026-0001`; `@@unique([organizationId, orderNumber])` |
| `customerId`              | String        | FK Customer                                                             |
| `salesRepId`              | String?       | FK User; default = ator que cria                                        |
| `status`                  | OrderStatus   | `@default(DRAFT)`                                                       |
| `currency`                | String        | `@db.Char(3)`, default `EUR`                                            |
| `subtotalEur`             | Decimal(14,2) | recalculado no servidor                                                 |
| `vatEur`                  | Decimal(14,2) | recalculado no servidor                                                 |
| `totalEur`                | Decimal(14,2) | recalculado no servidor                                                 |
| `notes`                   | String?       |                                                                         |
| `requestedDeliveryDate`   | DateTime?     |                                                                         |
| `shippingAddress`         | Json?         | snapshot da morada de entrega                                           |
| `createdAt` / `updatedAt` | DateTime      |                                                                         |

Índices: `(organizationId, status)`, `(organizationId, customerId)`,
`(organizationId, salesRepId)`. Relações: `lines CustomerOrderLine[]`,
`history OrderStatusHistory[]`. `@@map("customer_order")`.

### `model CustomerOrderLine`

| Campo                     | Tipo          | Notas                                                                                         |
| ------------------------- | ------------- | --------------------------------------------------------------------------------------------- |
| `id`                      | String cuid   | PK                                                                                            |
| `organizationId`          | String        | multi-tenant                                                                                  |
| `orderId`                 | String        | FK CustomerOrder (cascade)                                                                    |
| `variantId`               | String        | FK ProductVariant                                                                             |
| `qty`                     | Int           | > 0                                                                                           |
| `unitPriceEur`            | Decimal(12,2) | **snapshot**                                                                                  |
| `discountPct`             | Decimal(5,4)  | **snapshot** (0–1)                                                                            |
| `vatPct`                  | Decimal(5,2)  | **snapshot**; 23 se `taxCountry='PT'`, senão 23 (IVA intracomunitário fica para fatia futura) |
| `lineTotalEur`            | Decimal(14,2) | **snapshot**                                                                                  |
| `priceSource`             | String        | `CUSTOMER_SPECIAL` \| `TIER_LIST` \| `OVERRIDE`                                               |
| `createdAt` / `updatedAt` | DateTime      |                                                                                               |

`@@unique([orderId, variantId])`. `@@map("customer_order_line")`.

### `model OrderStatusHistory`

| Campo            | Tipo         | Notas                      |
| ---------------- | ------------ | -------------------------- |
| `id`             | String cuid  | PK                         |
| `organizationId` | String       | multi-tenant               |
| `orderId`        | String       | FK CustomerOrder (cascade) |
| `fromStatus`     | OrderStatus? | null na entrada inicial    |
| `toStatus`       | OrderStatus  |                            |
| `actorId`        | String?      | FK User                    |
| `reason`         | String?      |                            |
| `createdAt`      | DateTime     |                            |

Na criação da encomenda regista entrada inicial `null → DRAFT`. `@@map("order_status_history")`.

**Impacto da migration**: puramente aditivo — novas tabelas + novo enum. Sem backfill,
sem alteração de coluna existente, sem lock perigoso. Reversível.

## Estrutura do módulo

```
backend/src/modules/orders/
  orders.routes.ts        # define rotas + guards (requireAuth/requireRole)
  orders.controller.ts    # parse req → service → resposta
  orders.service.ts       # regras: ABAC, gating DRAFT, snapshots, totais, audit
  orders.repository.ts    # única camada Prisma do módulo (multi-tenant)
  orders.schemas.ts       # Zod .strict() em todos os entrypoints
  orders.service.test.ts  # testes de serviço
backend/src/domain/orders/
  recompute-totals.ts     # função pura: linhas → {subtotal, vat, total}
  recompute-totals.test.ts
  order-number.ts         # geração do orderNumber legível
```

Registo: `app.use('/api/orders', ordersRouter())` em `backend/src/app.ts`.

## Endpoints

Todos protegidos (`requireAuth`). Mutações de linha e de cabeçalho só permitidas em
`status === 'DRAFT'`.

| Método | Rota                            | Função                                                                                                 |
| ------ | ------------------------------- | ------------------------------------------------------------------------------------------------------ |
| POST   | `/api/orders`                   | Cria DRAFT (`customerId`, `lines[]?` inline). Valida customer (existe, não BLOCKED, visível por ABAC). |
| GET    | `/api/orders`                   | Lista com filtros (`status`, `customerId`), paginação (`take`/`skip`), ABAC scoped.                    |
| GET    | `/api/orders/:id`               | Detalhe + linhas. 404 + ABAC.                                                                          |
| PATCH  | `/api/orders/:id`               | Edita cabeçalho (`notes`, `requestedDeliveryDate`, `shippingAddress`). Só DRAFT.                       |
| DELETE | `/api/orders/:id`               | Apaga. Só DRAFT.                                                                                       |
| POST   | `/api/orders/:id/lines`         | Adiciona linha (`variantId`, `qty`, `override?`). Resolve snapshot.                                    |
| PATCH  | `/api/orders/:id/lines/:lineId` | Edita (`qty`, `override?`). Re-resolve snapshot.                                                       |
| DELETE | `/api/orders/:id/lines/:lineId` | Remove linha.                                                                                          |

Cada mutação de linha recalcula `subtotalEur/vatEur/totalEur` na mesma transação.

### Geração de `orderNumber`

Formato `ENC-{ano}-{seq}` (seq por org, zero-padded). Implementação: dentro da
transação de criação, conta as encomendas existentes da org no ano e tenta inserir;
em colisão de unicidade (`P2002`) faz retry com incremento. Mantém-se simples e
robusto sem tabela de sequências dedicada nesta fatia.

## Invariantes de negócio

- **Multi-tenant**: `organizationId` em todas as tabelas e queries.
- **Snapshots de preço por linha**: `unitPriceEur/discountPct/vatPct/lineTotalEur`
  gravados no momento; floor (`cost × 1.10`) validado via `resolvePrice` (inclui
  caminho `override`). Mudar uma `PriceList` nunca altera linhas já gravadas.
- **Totais sempre no servidor**: nunca confiar no frontend (§9). Recalculados a cada
  mutação de linha.
- **ABAC**: `SALES_REP` só vê/edita encomendas dos seus clientes (reusa `scopeForRole`
  e valida visibilidade do customer no create). `SALES_MANAGER`/`ADMIN`/`OWNER` veem
  tudo.
- **Gating por estado**: mutações só em `DRAFT`; fora disso lança
  `ConflictError('ORDER_NOT_EDITABLE')`. Prepara a FSM da fatia 2 sem a implementar.
- **Audit log**: create/update/delete via `writeAudit`.

## Erros (subclasses `AppError`)

| Código                 | Classe          | Quando                                         |
| ---------------------- | --------------- | ---------------------------------------------- |
| `CUSTOMER_NOT_FOUND`   | NotFoundError   | customer inexistente ou fora da org/ABAC       |
| `CUSTOMER_BLOCKED`     | ForbiddenError  | customer com `status = BLOCKED`                |
| `ORDER_NOT_FOUND`      | NotFoundError   | encomenda inexistente ou fora da org/ABAC      |
| `ORDER_NOT_EDITABLE`   | ConflictError   | mutação fora de DRAFT                          |
| `ORDER_LINE_NOT_FOUND` | NotFoundError   | linha inexistente                              |
| `ORDER_LINE_DUPLICATE` | ConflictError   | variant já presente na encomenda               |
| `PRICE_BELOW_FLOOR`    | ValidationError | propagado de `resolvePrice` (override < floor) |
| `PRICE_NOT_FOUND`      | NotFoundError   | propagado: sem special nem tier line aplicável |

## Testes

Seguindo `pricing.service.test.ts`:

- **Domínio puro**: `recomputeTotals` (subtotal/vat/total com múltiplas linhas, IVA,
  arredondamento a 2 casas); `order-number` (formato, padding).
- **Serviço**: create com lines inline → snapshots corretos e totais; override abaixo do
  floor → `PRICE_BELOW_FLOOR`; create com customer BLOCKED → `CUSTOMER_BLOCKED`; ABAC
  (SALES_REP não vê encomenda de outro rep); guards DRAFT-only em PATCH/DELETE/lines;
  variant duplicado → `ORDER_LINE_DUPLICATE`; recálculo de totais após add/edit/remove
  de linha.

## Fora de âmbito (confirmado)

- Transições de FSM e uso ativo de `OrderStatusHistory` além da entrada inicial.
- Reserva/release de stock e conversão para `OUT`.
- Verificação de limite de crédito.
- Geração de fatura / Quote (provider externo).
- Devoluções (Returns).
- Frontend (a rota `orders.tsx` existente será ligada numa fatia de frontend dedicada).
