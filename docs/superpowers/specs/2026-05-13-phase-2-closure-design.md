# Phase 2 Closure — Design Spec

**Data:** 2026-05-13
**Estado:** Aprovado, pronto para implementação
**Próximo passo:** Plano de implementação detalhado via `writing-plans` skill

---

## 1. Contexto

O projeto CRM Florista B2B (especificação em `prompt.md` v3) está em transição entre Phase 2 e Phase 3 do build plan §15. O working tree contém:

- **Phase 0** (Bootstrap): completo, validado.
- **Phase 1** (Núcleo Comercial — RBAC, suppliers, customers, leads, products): completo no backend, listings no frontend, validado end-to-end com dados reais.
- **Phase 2** (Stock & Pricing): **parcialmente feita**.
  - ✅ Schema + migração `20260511_phase_2_stock_pricing`
  - ✅ Domain puro: `domain/pricing/{price-floor, resolve-price}.ts`, `domain/stock/safety-stock.ts` com tests unitários
  - ✅ Módulo HTTP `stock` (locations, levels, movements, reservations, transfers) montado em `app.ts`
  - ❌ Módulo HTTP `pricing` — **não existe**
  - ❌ Frontend forms (stock, pricing, e ainda dívida retroativa de Phase 1)
  - ❌ Testes de integração HTTP (Supertest) para qualquer módulo

**Estado git:** nenhum commit. ~80 ficheiros untracked desde 2026-05-10. Remote vai ser inicializado nesta sessão: `git@github.com:cruor-organization/cruor-crm.git`, push para `main`.

`HANDOFF.md` (datado 2026-05-11) está parcialmente desactualizado: afirma "Phase 2 não começou" quando o working tree mostra Phase 2 baseline já implementado.

## 2. Objetivo

Fechar Phase 2 de forma honesta — o que significa: invariantes obrigatórias verificadas por testes de integração, UI utilizável, e história git em ordem antes de Phase 3 (Encomendas) arrancar.

## 3. Scope

### Dentro

1. **Módulo HTTP `pricing`** (mínimo): CRUDs para `PriceList`, `PriceListLine`, `CustomerSpecialPrice` + endpoint `POST /api/pricing/resolve`.
2. **Frontend forms** para todas as entidades de Phase 1 e 2 (Suppliers, Customers, Leads, Products, Stock locations/movements, Price lists/lines/specials).
3. **Testes de integração Supertest** para os 6 módulos backend (4 Phase 1 + 2 Phase 2).
4. **Mapping de erros Prisma → HTTP** no errorHandler (pré-requisito para tests).
5. **Inicialização git remote + 25 commits** (5 âncora retroativos + ~20 progressivos).
6. **Atualização docs**: HANDOFF, retrospetiva Phase 2, README.

### Fora

| Item                                                  | Razão                                                            | Quando                          |
| ----------------------------------------------------- | ---------------------------------------------------------------- | ------------------------------- |
| CSV import em pricing (§10.15 few-shot 2)             | Pago grande; Phase 5 é o sítio natural                           | Phase 5                         |
| 2FA TOTP em OWNER/ADMIN                               | Capítulo de hardening                                            | Phase 8                         |
| Advisory lock no signup gate                          | Race teórica, sem incidente                                      | Phase 8                         |
| BullMQ + Redis                                        | Sem job async crítico em Phase 2                                 | Phase 3                         |
| Audit log diff `{before, after}`                      | Funcional sem isto                                               | Phase 3 ou 8                    |
| Better Auth invite com role enum custom               | Plugin organization usa lowercase defaults; precisa custom roles | Phase 3 ou Phase 5              |
| Bundles HTTP module                                   | Conceito de catálogo, não Phase 2                                | Phase 5                         |
| `landedEur` completo (cost + freight + duty + tariff) | Hoje só `costEur` no schema                                      | Phase 3                         |
| `exactOptionalPropertyTypes: true`                    | Fricção significativa com Prisma                                 | Reavaliar Phase 8               |
| CI com Postgres service container                     | Local pass chega; corrigir CI depois                             | Próxima sessão / commit isolado |
| Frontend component / e2e tests                        | §15 Phase 2 não exige                                            | Phase 8                         |

### Dívida assumida nesta sessão

- Schemas Zod duplicados entre `backend/src/modules/*/schemas.ts` e `frontend/src/lib/schemas/*.ts` — consequência de ADR-0002 (3-folder standalone, sem packages partilhados).
- Modelos sem UI: bundles, returns, routes, visits — não exigidos por Phase 2.

## 4. Definition of Done

| #   | Critério                                                                                                                                                       | Evidência                                     |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------- |
| 1   | Módulo HTTP `pricing` com 15 endpoints (CRUDs + activate/archive + resolve)                                                                                    | Endpoints respondem, RBAC enforced            |
| 2   | Forms de criação/edição no frontend para todas as entidades Phase 1+2                                                                                          | Botões "Novo" e edição em cada listing/página |
| 3   | Supertest tests para 6 módulos backend                                                                                                                         | ~30 tests verdes                              |
| 4   | Invariantes Phase 2 verificadas em teste de integração: stock qty ≥ 0, price floor (landed×1.10), `RESERVE/RELEASE` simétrico, race de reservation concorrente | Tests verdes                                  |
| 5   | Pipeline `lint && typecheck && test && build` verde nos 3 serviços                                                                                             | Local execution                               |
| 6   | Git: repo no remote, ~25 commits ordenados (A1-A7 + B1-B19), `main` em sync                                                                                    | `git log --oneline` legível                   |
| 7   | Docs atualizados: HANDOFF reflecte Phase 2 done, `docs/02-phase-2.md` criado                                                                                   | Ficheiros existem                             |

## 5. Arquitetura

### 5.1 Módulo HTTP `pricing`

**Estrutura** (espelha `stock`):

```
backend/src/modules/pricing/
├── pricing.routes.ts
├── pricing.controller.ts
├── pricing.service.ts
├── pricing.repository.ts
└── pricing.schemas.ts
```

Montado em `app.ts`: `app.use('/api/pricing', pricingRouter())`.

**Endpoints:**

| Método | Path                                   | RBAC                 |
| ------ | -------------------------------------- | -------------------- |
| GET    | `/api/pricing/lists`                   | qualquer auth        |
| GET    | `/api/pricing/lists/:id`               | qualquer auth        |
| POST   | `/api/pricing/lists`                   | ADMIN, SALES_MANAGER |
| PATCH  | `/api/pricing/lists/:id`               | ADMIN, SALES_MANAGER |
| POST   | `/api/pricing/lists/:id/activate`      | ADMIN, SALES_MANAGER |
| POST   | `/api/pricing/lists/:id/archive`       | ADMIN                |
| GET    | `/api/pricing/lists/:id/lines`         | qualquer auth        |
| POST   | `/api/pricing/lists/:id/lines`         | ADMIN, SALES_MANAGER |
| PATCH  | `/api/pricing/lists/:id/lines/:lineId` | ADMIN, SALES_MANAGER |
| DELETE | `/api/pricing/lists/:id/lines/:lineId` | ADMIN                |
| GET    | `/api/pricing/special-prices`          | qualquer auth        |
| POST   | `/api/pricing/special-prices`          | ADMIN, SALES_MANAGER |
| PATCH  | `/api/pricing/special-prices/:id`      | ADMIN, SALES_MANAGER |
| DELETE | `/api/pricing/special-prices/:id`      | ADMIN                |
| POST   | `/api/pricing/resolve`                 | qualquer auth        |

**`POST /api/pricing/resolve` — contrato:**

Body Zod `.strict()`:

```ts
{
  variantId: string,
  qty: number,                   // int positive
  customerId?: string,
  overrideUnitEur?: number,
}
```

Resposta 200:

```ts
{
  unitPriceEur: number,
  appliedDiscountPct: number,
  lineTotalEur: number,
  source: 'CUSTOMER_SPECIAL' | 'TIER_LIST' | 'OVERRIDE',
}
```

Erros:

- `400 PRICE_QTY_INVALID`
- `404 PRICE_NOT_FOUND`
- `404 VARIANT_NOT_FOUND`
- `404 CUSTOMER_NOT_FOUND`
- `400 PRICE_BELOW_FLOOR`

**Repository — pontos-chave:**

- `findActiveTierLine(orgId, variantId, tier, qty, now)`: select `priceListLine` com `priceList.status='ACTIVE'`, validade ativa, `minQty <= qty`, **ordem `minQty DESC`, take 1**.
- `findActiveCustomerSpecial(orgId, customerId, variantId, now)`: idem com `validUntil IS NULL OR validUntil > now`. Sem `SELECT FOR UPDATE` (leitura pura).
- `getVariantWithLandedCost(orgId, variantId)`: select variant + `costEur` → `landedEur = variant.costEur` (até Phase 3 trazer breakdown completo).

**Service — invariantes:**

1. Todas as queries via repository com `ctx.orgId`.
2. `activate`: bloqueia se existir outra `PriceList` ACTIVE com (mesma tier, mesma currency, validade sobreposta) → `ConflictError("PRICE_LIST_OVERLAP")`.
3. Cada mutation grava `AuditLog` via `writeAudit(ctx, 'PriceList', id, action, changes)`. `resolve` é read-only, não audita.
4. Services nunca aceitam preço sem `enforceFloor()` (chamado no domain `resolvePrice` ou explicitamente em `createSpecialPrice` / `updateLine`).

### 5.2 Frontend — convenção de forms

**Dependências a adicionar:**

- `react-hook-form`
- `@hookform/resolvers/zod`

**Schemas:** duplicação consciente em `frontend/src/lib/schemas/*.ts` (copy do backend).

**Padrão por entidade:**

| Entidade                    | Onde                                                                                                       |
| --------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `Supplier` (~10 campos)     | Modal em `/suppliers`                                                                                      |
| `Customer` (~15+ campos)    | Página dedicada `/customers/new` e `/customers/$id/edit` (tabs por grupo)                                  |
| `CustomerLead` (~8 campos)  | Modal em `/leads`                                                                                          |
| `Product` (20+ campos)      | Página dedicada `/products/new` e `/products/$id/edit` (tabs: Identidade / Visual / Logística / Comercial) |
| `StockLocation` (~5 campos) | Modal em `/stock`                                                                                          |
| `StockMovement`             | Modal em `/stock`                                                                                          |
| `PriceList` (~6 campos)     | Modal em `/pricing`                                                                                        |
| `PriceListLine`             | Inline edit table em `/pricing/$id`                                                                        |
| `CustomerSpecialPrice`      | Modal numa aba "Specials" em `/pricing`                                                                    |

**Páginas novas:**

```
frontend/src/routes/
├── stock.tsx                 # tabs: Levels | Movements | Locations
├── pricing/                  # ou flat conforme tsr.config.json
│   ├── index.tsx             # listing PriceLists + tab Specials
│   ├── $id.tsx               # detail + lines editor + resolve calculator
└── customers/new.tsx, $id.edit.tsx
└── products/new.tsx, $id.edit.tsx
```

**Lib helpers:**

```
frontend/src/lib/
├── forms/
│   ├── useFormSubmit.ts      # RHF + react-query mutation; mapeia 400 ValidationError para setError(field, ...)
│   └── FieldError.tsx
└── schemas/
    ├── supplier.ts, customer.ts, lead.ts, product.ts, stock.ts, pricing.ts
```

**Erros server-side:** `useFormSubmit` apanha `400 ValidationError` `{code, message, details: {field: 'msg'}}` e chama `setError(field, {message})` no RHF. Erros gerais (404, 409, 500) → toast/banner.

**Price calculator sidebar** em `/pricing/$id`: selector de Customer + Variant + qty + botão Resolve → mostra `unitPriceEur`, `appliedDiscountPct`, `source`.

### 5.3 Testes de integração (Supertest)

**Dependências:** `supertest`, `@types/supertest`.

**Helpers:**

`backend/tests/helpers/server.ts`:

- `createTestApp()` — reusa factory de `app.ts`, env override, logger silenciado.
- `createTestAuth(role)` — cria session Better Auth programaticamente, retorna `{cookie, ctx}`.

`backend/tests/helpers/db.ts`:

- `seedOrg(role)` → cria `Organization` + `User` + `Member`. Cada test file usa orgId único como namespace lógico.
- `truncate()` para limpar entre tests do mesmo file.

**Estratégia DB:**

- Default: Supabase local `:54322`, multi-tenant isolation lógica via orgId.
- Excepção: tests de race (reservation concorrente) usam 2 connections Prisma raw para forçar cenário.
- Pré-requisito: DB de teste com migrations aplicadas (`prisma migrate deploy`). Helper `seedOrg` assume schema atualizado — se `pnpm test` correr contra DB virgem, deve falhar com erro explícito antes de qualquer test correr.

**Scope (~30 tests):**

| Módulo              | Tests específicos                                                                                                           |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `suppliers`         | create+list happy; PATCH como SALES_REP → 403; score recalcula via service                                                  |
| `customers`         | create+list+activities; ABAC SALES_REP (2 reps, 2 customers); validação NIF                                                 |
| `leads`             | kanban status update; convert atómico (simular falha + verify rollback); double-convert → 409                               |
| `products`          | create+vote; SKU duplicado → 409; PATCH decision como SALES_REP → 403                                                       |
| `stock` movements   | location + IN sobe `available`; OUT abaixo de zero → 400 via Postgres CHECK                                                 |
| `stock` reservation | RESERVE qty>available → 400; RESERVE+RELEASE simétrico; **race**: 2× RESERVE qty=8 quando available=10, exatamente 1 sucede |
| `stock` transfer    | from desce + to sobe atomic; same location → 400                                                                            |
| `pricing` lists     | activate happy; ARCHIVED bloqueia PATCH; overlap → 409 PRICE_LIST_OVERLAP                                                   |
| `pricing` specials  | abaixo de floor → 400 PRICE_BELOW_FLOOR; activeOnly filter                                                                  |
| `pricing` resolve   | OVERRIDE bypassa; CUSTOMER_SPECIAL > TIER_LIST; sem match → 404; floor → 400                                                |

### 5.4 Mapping de erros Prisma → HTTP

Atualizar `backend/src/middlewares/error.ts` para mapear:

| Prisma / PG                         | HTTP | Code                                            |
| ----------------------------------- | ---- | ----------------------------------------------- |
| `P2002` (unique violation)          | 409  | `CONFLICT`                                      |
| `P2003` (FK violation)              | 400  | `INVALID_REFERENCE`                             |
| `P2025` (record not found)          | 404  | `NOT_FOUND`                                     |
| Postgres `23514` (CHECK constraint) | 400  | `INVARIANT_VIOLATION` (`details: {constraint}`) |

Pré-requisito para tests `stock OUT abaixo de zero` e outros que dependem de constraints.

## 6. Plano de commits

### 6.1 Inicialização

```bash
git add README.md
git commit -m "first commit"
git remote add origin git@github.com:cruor-organization/cruor-crm.git
git push -u origin main
```

### 6.2 Fase A — 7 commits-âncora retroativos

| #   | Mensagem                                                                           | Paths principais                                                                                                                                                                                                                                                                                                                 |
| --- | ---------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A1  | `docs: master prompt v3 + project instructions`                                    | `prompt.md`, `CLAUDE.md`                                                                                                                                                                                                                                                                                                         |
| A2  | `chore: repo tooling baseline (pnpm, prettier, husky, commitlint, eslint configs)` | root configs, `.husky/`, `.github/`, `docker/`, `supabase/config.toml`, `docs/architecture.md`, `docs/00-bootstrap.md`, `docs/decisions/000{1,2}-*.md`                                                                                                                                                                           |
| A3  | `feat(backend): phase 0 — better-auth + prisma init + express skeleton`            | `backend/{package.json, tsconfig*, eslint, Dockerfile, vitest, .env*}`, `backend/prisma/migrations/20260510_init/`, `backend/prisma/schema.prisma` **podado para Phase 0 only** (Better Auth tables + pgvector), `backend/src/{index,app,logger,config,auth,db,middlewares,routes,shared,types}`, `backend/tests/health.test.ts` |
| A4  | `feat(frontend): phase 0 — vite + tanstack router + auth client + listings shells` | `frontend/{package.json, vite, tsconfig*, tsr.config, tailwind, postcss, eslint, Dockerfile, index.html, .env*}`, `frontend/src/{main, vite-env, lib/, routes/__root, routes/index, routes/sign-in, routes/sign-up, routes/customers, routes/leads, routes/suppliers, routes/products}`                                          |
| A5  | `feat: phase 1 — schema + RBAC + 4 módulos backend`                                | `backend/prisma/schema.prisma` **completo até Phase 1**, `backend/prisma/migrations/20260510_phase_1_domain/`, `backend/src/modules/{suppliers,customers,leads,products,audit}`, `backend/src/domain/{suppliers,customers}`                                                                                                      |
| A6  | `feat: phase 2 baseline — schema + stock module + pricing domain`                  | `backend/prisma/schema.prisma` **estado final**, `backend/prisma/migrations/20260511_phase_2_stock_pricing/`, `backend/src/modules/stock/`, `backend/src/domain/{stock,pricing}`                                                                                                                                                 |
| A7  | `docs: handoff + phase 1 retrospective + ai-service stub`                          | `docs/HANDOFF.md`, `docs/01-phase-1.md`, `ai-service/`, `README.md`                                                                                                                                                                                                                                                              |

**Nota sobre `schema.prisma`:** o ficheiro contém o estado final consolidado. Para A3 vai ser **manualmente podado** para conter apenas as entidades Phase 0. Em A5 cresce para incluir Phase 1. Em A6 atinge o estado final. Tempo estimado: 10 min, com `prisma migrate status` em clone temporário para validar consistência antes de pushar.

### 6.3 Fase B — commits progressivos

| #   | Mensagem                                                                              |
| --- | ------------------------------------------------------------------------------------- |
| B1  | `chore(backend): map prisma errors (P2002/P2003/P2025/CHECK) in errorHandler`         |
| B2  | `feat(backend): pricing HTTP module (lists, lines, specials, resolve)`                |
| B3  | `test(backend): supertest helpers (createTestApp, seedOrg, createTestAuth)`           |
| B4  | `test(suppliers): supertest happy + RBAC + multi-tenant`                              |
| B5  | `test(customers): supertest + ABAC sales_rep`                                         |
| B6  | `test(leads): supertest + convert atomicity + double-convert`                         |
| B7  | `test(products): supertest + sku conflict + vote`                                     |
| B8  | `test(stock): supertest movements + qty>=0 invariant`                                 |
| B9  | `test(stock): reservation race test`                                                  |
| B10 | `test(pricing): supertest lists + activate + overlap`                                 |
| B11 | `test(pricing): supertest specials + resolve hierarchy + floor`                       |
| B12 | `feat(frontend): form helpers (useFormSubmit, FieldError, schemas/)`                  |
| B13 | `feat(frontend): supplier form (modal)`                                               |
| B14 | `feat(frontend): lead form (modal)`                                                   |
| B15 | `feat(frontend): customer form (dedicated page)`                                      |
| B16 | `feat(frontend): product form (dedicated page, tabs)`                                 |
| B17 | `feat(frontend): stock page (levels + movements + locations + forms)`                 |
| B18 | `feat(frontend): pricing page (lists + lines editor + specials + resolve calculator)` |
| B19 | `docs: phase 2 retrospective + handoff update`                                        |

**Total: ~27 commits** (init + A1-A7 + B1-B19) + 2-3 mini-commits `chore(<service>): add <dep>` (supertest, react-hook-form, @hookform/resolvers) intercalados antes dos B's que deles dependem, para isolar lockfile changes.

### 6.4 Política de push

- `git push origin main` **após cada commit**.
- Se commit falhar lint/test (husky): corrigir, refazer **NEW commit** (não `--amend`).
- Reverts: `git revert` (commit novo), nunca `reset --hard` em main.

### 6.5 Workflow por commit

1. `pnpm -C <service> lint && typecheck` (do service tocado).
2. `pnpm -C <service> test` (se tocou em código testado).
3. `git add <paths explícitos>` (nunca `git add .`).
4. `git status` para confirmar staging.
5. `git commit -m "<msg>"` (husky corre commitlint).
6. `git push origin main`.

## 7. Riscos e mitigações

| Risco                                                   | Mitigação                                                                       |
| ------------------------------------------------------- | ------------------------------------------------------------------------------- |
| Schema split A3/A5/A6 — podar `schema.prisma` é frágil  | Rodar `prisma migrate status` em clone temporário antes de cada push retroativo |
| Race test de reservation pode ser flaky                 | `Promise.allSettled` com 5+ tentativas; se persistente, `.skip` + TODO          |
| B1 (Prisma error mapping) é pré-requisito de outros B's | B1 é o primeiro B, validado em isolamento antes de avançar                      |
| Sessão interrompida com 25 commits planeados            | Cada commit pushed; HANDOFF actualizado mid-stream (não só no B19)              |
| Lockfiles inflados nos commits principais               | Mini-commits `chore: add <dep>` isolados                                        |

## 8. Critérios de paragem

Phase 2 considera-se fechada quando:

- Pipeline `lint && typecheck && test && build` verde nos 3 serviços.
- ~30 supertest tests verdes.
- 6 forms acessíveis no browser; smoke manual: criar 1 supplier, customer, lead, product, stock movement, price list.
- HANDOFF aponta para Phase 3 e lista as dívidas explícitas (§3 Fora).
- `git log --oneline` mostra ~27 commits + mini-chores em `main` no remote.

---

**Pronto para writing-plans.** O plano de implementação detalhado virá da próxima skill.
