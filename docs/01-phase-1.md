# Fase 1 — Núcleo Comercial

Concluída em 2026-05-10. Cobertura: schemas + RBAC + Suppliers + Customers + Leads + Products (core).

## Entregue

### Schema (`backend/prisma/schema.prisma` + migração `20260510_phase_1_domain`)

| Entidade                                          | Notas                                                                                                             |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `Supplier`                                        | tipo (ALIBABA_SELLER/EU_IMPORTER/...), incoterms, lead time, contactos JSON, score cache                          |
| `Customer`                                        | businessType, NIF, addresses[], contacts[], escalão, salesRep, créditos, sazonalidade                             |
| `CustomerLead`                                    | Kanban (`status`), score 0-100 calculado no domain, conversão atómica                                             |
| `CustomerActivity`                                | cronologia (CALL/VISIT/WHATSAPP/ORDER/.../STATUS_CHANGED)                                                         |
| `Product`                                         | atributos físicos + visuais + flores secas (botanical, shelfLife, batchDate) + sazonalidade + comercial + decisão |
| `ProductVariant` / `ProductMedia` / `ProductVote` | tabelas relacionadas                                                                                              |
| `Bundle`                                          | kit promocional (estrutura, sem rotas ainda)                                                                      |
| `AuditLog`                                        | escrito via `writeAudit()` nos services para mutations sensíveis                                                  |

Enums §8 mapeados directamente em `member.role` via Better Auth organization plugin. Migração existing user `owner → OWNER` aplicada.

### RBAC (`backend/src/shared/rbac.ts` + `middlewares/auth-context.ts`)

- Enum `AppRole`: OWNER, ADMIN, SALES_MANAGER, SALES_REP, WAREHOUSE, MARKETING, VIEWER
- `hasRole()` / `hasAnyRole()` com hierarquia (não-estrita) configurada
- `attachAuthContext()` injeta `req.ctx` (actorId, email, orgId, role); guards `requireAuth()` e `requireRole(...)`
- ABAC: `SALES_REP` só vê os seus customers/leads (filtro automático no service)

### Domain (puro, testado)

- `domain/suppliers/scoring.ts` — pontualidade(40)+qualidade(40)+comunicação(20)
- `domain/customers/lead-scoring.ts` — sinais do setor (§10.3 few-shot 2): businessType, volume, IG, sqm, zona prime, source
- 8 testes unitários verdes

### Módulos (`routes → controller → service → repository`)

| Módulo           | Endpoints                                                               | Notas                                                         |
| ---------------- | ----------------------------------------------------------------------- | ------------------------------------------------------------- |
| `/api/suppliers` | GET list/get, POST, PATCH, DELETE                                       | RBAC: list/view = qualquer auth, mutate = ADMIN/SALES_MANAGER |
| `/api/customers` | GET list/get, GET /:id/activities, POST, PATCH, DELETE                  | ABAC SALES_REP automático                                     |
| `/api/leads`     | GET list/get, POST, PATCH, PATCH /:id/status, POST /:id/convert, DELETE | conversão atómica em `prisma.$transaction`                    |
| `/api/products`  | GET list/get, POST, PATCH, PATCH /:id/decision, POST /:id/votes, DELETE | voto multi-sócio com agregação score/visualScore              |

Cada controller usa `asyncHandler()` wrapper (Express 4 não propaga promise rejections).

### Auditoria

- `modules/audit/audit.service.ts` exporta `writeAudit(ctx, entity, id, action, changes)`
- Services chamam após cada mutation sensível
- Tabela `audit_log` com índice `(organizationId, createdAt DESC)` e `(organizationId, entityType, entityId)`

### Frontend

- Rotas: `/customers`, `/leads`, `/suppliers`, `/products`
- Navbar global em `__root.tsx` (auth routes skipam navbar)
- Cliente HTTP `lib/api.ts` com cookie credentials e parsing de AppError
- `/leads` em Kanban (6 colunas, badges de score color-coded)
- Outras páginas em table view

### Hard Invariants cobertos (§9, §7.5)

- ✅ Multi-tenant: todas as querys filtram por `ctx.orgId`
- ✅ Zod `.strict()` em todos os endpoints
- ✅ AuditLog em mutations
- ✅ ABAC SALES_REP
- ✅ Sem `$queryRawUnsafe` (ESLint enforce)
- ⏳ 2FA TOTP — defer Fase 2 (configurar admin plugin com TOTP)
- ⏳ Race signup gate — `pg_advisory_xact_lock` defer Fase 2

## Validação end-to-end real (executada)

```
1. supabase start             → Postgres :54322 + pgvector 0.8.0
2. prisma migrate deploy      → 18 tabelas
3. pnpm dev (3 serviços)      → 200 OK em :3001, :3002, :5173
4. POST /api/auth/sign-up     → primeiro user fica OWNER (member.role=OWNER)
5. Segundo signup              → 403 SIGNUP_DISABLED
6. POST /api/suppliers         → 201 (Yiwu Bloom Co., FOB, lead 35d)
7. POST /api/leads             → 201, score=90 (matches domain test exactly)
8. PATCH /api/leads/:id/status → 200 (NEW → QUALIFIED)
9. POST /api/leads/:id/convert → 201 Customer + Activity + AuditLog atómicos
10. Re-converter mesmo lead    → 409 LEAD_ALREADY_CONVERTED
11. POST /api/products         → 201 (Limonium sinuatum, anchor, sazonal)
12. POST sku duplicado          → 409 PRODUCT_SKU_OR_SLUG_EXISTS
13. POST /api/products/:id/votes → vote upserted + aggregated score=8.5/visualScore=9
14. PATCH /api/products/:id/decision → APPROVED
15. GET /api/customers/:id/activities → CONVERTED_FROM_LEAD presente
```

## Pipeline (`pnpm lint && typecheck && test && build` em cada serviço)

- Backend: 0 lint errors, typecheck OK, **15 testes pass**, build OK
- Frontend: 0 lint errors, typecheck OK, build OK (dist gerado com rotas separadas)
- AI service: ainda stub (Phase 4)

## Dívida técnica honesta

1. **Sem testes de integração HTTP para os módulos novos** — apenas testes unitários do domain. Vale a pena adicionar Supertest tests para 1-2 fluxos por módulo (criar+listar+RBAC denied) antes da Fase 2.
2. **Form de criação no frontend** — neste momento só listings. Phase 2 traz forms (react-hook-form + Zod) com botão "Novo".
3. **2FA TOTP** — falta. Plugin já incluído mas não configurado. Plano: Phase 2 ativa para OWNER/ADMIN.
4. **Advisory lock no signup gate** — race teórica documentada em Fase 0 ainda não fechada.
5. **`exactOptionalPropertyTypes: false`** — friction com Prisma update inputs e Zod `.optional()`. Decisão pragmática; se em Phase 2/3 surgir bug por causa de `undefined`-vs-ausente, reavaliar.
6. **Audit log diff** — atualmente grava o `changes` cru (Zod input). Phase 2 melhora com diff `{ field: { before, after } }`.
7. **Better Auth invite endpoints** — não testados ainda. Phase 2 valida que invite emails funcionam (depende de Resend, que entra em Phase 5).

## Próximo passo

Phase 2 — **Stock & Pricing** (§15, 3-5d):

- `StockLocation` (PT_PORTO, PT_LISBOA, ES_BARCELONA)
- `StockLevel` por (variant, location) com CHECK `qty >= 0`
- `StockMovement` (IN, OUT, RESERVE, RELEASE, ADJUST, RETURN)
- `PriceList` por (tier, currency, validity) + `CustomerSpecialPrice`
- `resolvePrice()` domain function
- Alertas de safety stock
