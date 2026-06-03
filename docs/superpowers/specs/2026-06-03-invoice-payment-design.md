# Faturação — Invoice + Payment (provider via adapter)

- **Data**: 2026-06-03
- **Fase**: 3 — Encomendas (§10.14, §7.4; entidades `Invoice`/`Payment` do §7)
- **Âmbito desta fatia**: emissão de faturas ligada à FSM de `CustomerOrder`, com
  adapter de provider (mock) e registo manual de pagamentos. Inclui:
  - o **credit-limit check** em falta no `createOrder` (§10.14 few-shot 1);
  - regra de emissão: pronto-pagamento (`paymentTermDays === 0`) → fatura ao
    `CONFIRMED`; conta corrente (`> 0`) → fatura ao `SHIPPED` (§10.14 few-shot 2);
  - modelos `Invoice` + `InvoiceLine` + `Payment` com snapshots de totais;
  - FSM da fatura `PENDING → ISSUED → PAID`, com `VOID`;
  - `InvoiceProviderPort` com impl `mock` (numeração `FT-AAAA-NNNN`); stub `live`.
- **Fora de âmbito**: integração real Moloni/InvoiceXpress + emissão certificada AT
  (escolha do provider é **Fase 4**, §prompt linha 209); Stripe e pagamentos
  automáticos; notas de crédito; `queue:invoice-issue` via BullMQ (adiado, igual ao
  sync Alibaba); PDF da fatura.

## Contexto

A Fase 3 já entregou a FSM de `CustomerOrder` (`DRAFT → PENDING_CONFIRMATION →
CONFIRMED → PICKING → PACKED → SHIPPED → DELIVERED`, + devoluções), com
`OrderStatusHistory`, reserva atómica no `CONFIRMED` e expedição no `SHIPPED`. O
`transition()` (orders.service) já tem ganchos por estado: `reserveOrderLines` em
`CONFIRMED` e expedição em `SHIPPED` — pontos naturais para emitir a fatura.

Pré-requisitos já no schema: `Customer.creditLimitEur`, `Customer.paymentTermDays`,
`Customer.pricingTier`, `Customer.status`, `Customer.taxCountry`; `CustomerOrder`
com `subtotalEur`/`vatEur`/`totalEur` (snapshots) e `CustomerOrderLine` com
`unitPriceEur`/`discountPct`/`vatPct`/`lineTotalEur`.

**Lacuna confirmada**: o `createOrder` atual **não** faz a verificação de crédito do
§10.14 few-shot 1.

Peças reutilizadas: `writeAudit` (com `AuditAction` `STATUS_CHANGE`); o padrão de
adapter `Port` + mock + stub `live` da fatia Alibaba (§10.12); `prisma.$transaction`
interativo; `requireRole`/`hasAnyRole` (OWNER herda ADMIN).

## Decisões de arquitetura

### 1. Emissão auto-criada na transição, emitida após commit (Abordagem A)

Ao mover a encomenda para o estado-gatilho (`CONFIRMED` se pronto-pagamento,
`SHIPPED` se conta corrente), cria-se um `Invoice(PENDING)` **dentro** da transação
da transição, com snapshot das linhas/totais. A chamada ao provider (mock) corre
**depois do commit** — mantém I/O externo fora da transação de DB (como exigirá o
provider real na Fase 4) e alinha com `queue:invoice-issue` do spec sem introduzir
BullMQ agora.

- Idempotência: **uma fatura por encomenda** (`Invoice.orderId @unique`). A criação
  é `ensureInvoiceForOrderWithinTx` — salta se já existir.
- A emissão (`PENDING → ISSUED`) é best-effort após commit; se falhar, a fatura fica
  `PENDING` e é re-emitível por `POST /api/invoices/:id/issue` (self-healing, igual
  ao retry do sync Alibaba).

Alternativas rejeitadas: **B** (emissão 100% manual por endpoint) diverge do few-shot
2; **C** (criar DRAFT + emissão sempre manual) acrescenta um gate de baixo valor
enquanto o provider é mock.

### 2. `getCreditUsed` = exposição a recebimentos em aberto

Exposição de crédito do cliente no momento do `createOrder`:

```
creditUsed =
    Σ (invoice.totalEur − invoice.paidEur)  para invoices ISSUED (não PAID/VOID)
  + Σ (order.totalEur)                       para orders em {CONFIRMED, PICKING,
                                              PACKED, SHIPPED, DELIVERED} SEM fatura
```

A 2ª parcela cobre o intervalo em que uma encomenda a crédito já está comprometida
mas ainda não foi faturada (fatura só ao `SHIPPED`). A verificação pura:
`assertCreditAvailable(creditUsed, orderValue, creditLimitEur, paymentUpfront)` —
lança `ConflictError('CREDIT_LIMIT_EXCEEDED', { limit, used })` quando
`creditUsed + orderValue > creditLimitEur && !paymentUpfront`.

### 3. Provider via adapter (mock agora, real na Fase 4)

`InvoiceProviderPort { issue(invoice): Promise<{ number; externalId; raw }> }`.
- `mock`: numeração sequencial `FT-AAAA-NNNN` por org/ano (à imagem de
  `buildOrderNumber`/`buildQuoteNumber`).
- `live` (Moloni/InvoiceXpress): stub que lança `IntegrationError('INVOICE_PROVIDER_NOT_CONFIGURED')`.
- Seleção por env `INVOICE_PROVIDER` (`mock` default). Injeção por composição em
  `createApp` (como `createAlibabaApi`).

### 4. Numeração atribuída na emissão

O `number` (sequência fiscal) é responsabilidade do provider — só existe em `ISSUED`.
`PENDING` não tem `number`. Reforça a separação criação↔emissão.

## Componentes (ficheiros)

- `backend/prisma/schema.prisma` (+ migração aditiva `20260603_invoices_payments`):
  `Invoice`, `InvoiceLine`, `Payment`; enums `InvoiceStatus {PENDING, ISSUED, PAID,
  VOID}`, `PaymentMethod {TRANSFER, CARD, CASH, OTHER}`. CHECK `payment.amount > 0`,
  `invoice.paidEur >= 0`. Back-relations em `Organization`, `Customer`,
  `CustomerOrder` (`invoice Invoice?`), `ProductVariant`.
- `backend/src/domain/invoices/` (puro, TDD):
  - `credit.ts` — `assertCreditAvailable(...)`.
  - `trigger.ts` — `invoiceTriggerFor(paymentTermDays): 'CONFIRMED' | 'SHIPPED'`.
  - `invoice-fsm.ts` — `assertInvoiceTransition(from, to)`.
  - `payment.ts` — `applyPayment(totalEur, paidEur, amount): { paidEur; reachesPaid }`.
  - `invoice-number.ts` — `buildInvoiceNumber(year, seq)`.
  - cada um com `*.test.ts`.
- `backend/src/modules/invoices/`:
  - `invoice-provider.port.ts` (+ `mock`/`live` + `createInvoiceProvider(env)`).
  - `invoices.repository.ts` — list/getById; `getCreditUsed`; próximo número de sequência.
  - `invoices.service.ts` — `ensureInvoiceForOrderWithinTx`, `issueInvoice`,
    `registerPayment`, `voidInvoice`, `list`, `getById`.
  - `invoices.controller.ts`, `invoices.schemas.ts` (Zod `.strict()`), `invoices.routes.ts`.
- `backend/src/modules/orders/orders.service.ts`:
  - `createOrder`: inserir o credit-limit check.
  - `transition()`: chamar `ensureInvoiceForOrderWithinTx` no estado-gatilho (dentro da
    tx) e `issueInvoice` após commit (best-effort).
- `backend/src/config/env.ts` + `.env.example`: `INVOICE_PROVIDER`.
- `backend/src/app.ts`: criar provider e montar `app.use('/api/invoices', invoicesRouter(provider))`.
- `backend/scripts/verify-invoice-flow.ts`: prova E2E (org descartável, cascade cleanup).

## Fluxo de dados

1. `createOrder` → calcula `orderValue`, lê `getCreditUsed(customer)`, corre
   `assertCreditAvailable`. Cria a encomenda em `DRAFT` (inalterado a partir daqui).
2. `transition(order → CONFIRMED|SHIPPED)`:
   - hooks existentes (reserva/expedição) inalterados;
   - se `to === invoiceTriggerFor(customer.paymentTermDays)`:
     `ensureInvoiceForOrderWithinTx` cria `Invoice(PENDING)` + `InvoiceLine[]`
     (snapshot das `CustomerOrderLine`), idempotente por `orderId`.
3. Após commit da transição: `issueInvoice(invoiceId)` → `provider.issue()` →
   grava `number`/`externalId`/`raw`, estado `ISSUED`, `issuedAt`. Falha → fica
   `PENDING` (re-emitível).
4. `POST /api/invoices/:id/payments` → `applyPayment` recalcula `paidEur`; se cobre
   `totalEur`, fatura → `PAID`. Audit em cada passo.

## Tratamento de erros

- `CREDIT_LIMIT_EXCEEDED` (`ConflictError`, 409) no `createOrder`.
- `INVALID_INVOICE_TRANSITION` (`ValidationError`, 400) na FSM da fatura.
- `INVOICE_PROVIDER_NOT_CONFIGURED` (`IntegrationError`, 502) no stub `live`.
- `PAYMENT_EXCEEDS_OUTSTANDING` (`ValidationError`) se `amount > total − paid`.
- `INVOICE_NOT_FOUND` (`NotFoundError`). Multi-tenant em todas as queries.

## Invariantes de negócio preservados

- **Snapshots**: `Invoice`/`InvoiceLine` copiam totais/preços no momento da criação —
  alterações futuras de preço/encomenda não os mudam (§7.5).
- **Uma fatura por encomenda** (`orderId @unique`); emissão idempotente.
- **Limite de crédito** imposto no `createOrder` (§10.14).
- **Multi-tenant** (`organizationId` em tudo) e numeração sequencial por org/ano.
- I/O externo (provider) **fora** da transação de DB.

## Estratégia de testes

- **Domínio (unit)**: `assertCreditAvailable` (dentro/fora do limite, `paymentUpfront`
  bypassa), `invoiceTriggerFor` (0 → CONFIRMED, >0 → SHIPPED), `invoice-fsm`
  (transições válidas/ inválidas), `applyPayment` (parcial, exato, excesso),
  `buildInvoiceNumber`.
- **E2E** (`verify-invoice-flow.ts`, org descartável): (a) cliente pronto-pagamento →
  fatura criada+ISSUED ao `CONFIRMED`; (b) cliente a crédito → fatura ao `SHIPPED`, não
  antes; (c) `issueInvoice` idempotente; (d) pagamento total → `PAID`; (e)
  `CREDIT_LIMIT_EXCEEDED` quando excede o limite sem `paymentUpfront`.
- Suite backend (`vitest run`) verde; `tsc`/`eslint` limpos; migração aplicada.

## Fora de âmbito (confirmado)

Provider real (Fase 4), Stripe, notas de crédito, BullMQ `queue:invoice-issue`, PDF,
UI de faturas (a página frontend liga numa fatia separada, como pricing/alibaba).

## Self-critique

1. **`getCreditUsed` dupla-conta?** Não: invoices ISSUED e orders *sem* fatura são
   conjuntos disjuntos (uma order só conta na 2ª parcela enquanto não tem fatura).
   Risco: orders `DRAFT`/`PENDING_CONFIRMATION`/`CANCELLED` não contam — correto
   (ainda não comprometem crédito ou foram anuladas).
2. **Emitir após commit perde a atomicidade fatura↔emissão?** Sim, deliberadamente: a
   fatura existe (`PENDING`) mesmo que o provider falhe, e é re-emitível. É o
   comportamento certo para um efeito externo (não deve abortar a transição da
   encomenda).
3. **FSM da fatura é suficiente sem notas de crédito?** Para esta fatia sim; `VOID`
   cobre anulação. Estornos/notas de crédito entram com as devoluções/Fase posterior.
