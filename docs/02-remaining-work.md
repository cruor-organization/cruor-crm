# 02 — Remaining Work (Pendentes)

**Última atualização:** 2026-05-13

Documento vivo. Mapeia o estado actual face ao `prompt.md` v3 e ao plano de fases §15. Atualizar quando uma feature passa de "pendente" para "feita".

---

## Resumo executivo

| Fase                      | Status  | Cobertura backend                  | Cobertura frontend             |
| ------------------------- | ------- | ---------------------------------- | ------------------------------ |
| 0 Bootstrap               | ✅ done | 100%                               | 100%                           |
| 1 Núcleo Comercial        | ✅ done | 100%                               | 60% (listings sem forms reais) |
| 2 Stock & Pricing         | 🟡 50%  | Stock 80%, Pricing 30% (só domain) | 0%                             |
| 3 Encomendas              | ❌ 0%   | —                                  | —                              |
| 4 Conteúdo & IA           | ❌ 0%   | stub ai-service apenas             | —                              |
| 5 Catálogos & Campanhas   | ❌ 0%   | —                                  | —                              |
| 6 Automação & Crescimento | ❌ 0%   | —                                  | —                              |
| 7 Operação em Campo       | ❌ 0%   | —                                  | —                              |
| 8 Hardening               | ❌ 0%   | —                                  | —                              |

**Sessão actual (2026-05-13):** pivot para construir esqueleto frontend completo com mocks, antes de implementar features novas. Objectivo: ter visão clara do produto inteiro para depois decidir prioridades em brainstorming.

---

## Por módulo (§10.1-§10.21)

Cada linha: **§ref** | **módulo** | **backend** | **frontend** | **integrações externas** | **fase**.

### Comercial (Phases 1-3)

| §     | Módulo              | Backend                                                                     | Frontend                                            | Externos                             | Fase |
| ----- | ------------------- | --------------------------------------------------------------------------- | --------------------------------------------------- | ------------------------------------ | ---- |
| 10.1  | Dashboard Métricas  | ❌ Falta agregador queries (KPIs)                                           | ❌ Falta dashboard real (placeholder atual é vazio) | —                                    | 1-2  |
| 10.2  | Gestão Fornecedores | ✅ CRUD + scoring domain                                                    | 🟡 listing sem form                                 | —                                    | 1    |
| 10.3  | Floristas + Leads   | ✅ CRUD + activities + scoring + convert atómico                            | 🟡 listings + kanban, sem forms                     | —                                    | 1    |
| 10.4  | Produtos            | ✅ CRUD + decisão multi-sócio + votes                                       | 🟡 listing sem form                                 | (AI vision opcional Fase 4)          | 1    |
| 10.13 | Stock               | ✅ locations/levels/movements/reservations/transfers                        | ❌ Página não existe                                | —                                    | 2    |
| 10.15 | Preços Escalão      | 🟡 domain `resolvePrice` + `enforceFloor` (testados); **falta módulo HTTP** | ❌ Não existe                                       | —                                    | 2    |
| 10.14 | Encomendas Clientes | ❌ Não começou                                                              | ❌ Não começou                                      | Invoice provider externo (a definir) | 3    |
| 10.12 | Alibaba sync        | ❌ Não começou                                                              | ❌ Não começou                                      | Alibaba API/scraping                 | 3    |
| 10.18 | Devoluções          | ❌ Não começou                                                              | ❌ Não começou                                      | —                                    | 3    |

### Conteúdo & IA (Phase 4)

| §    | Módulo                         | Backend                            | Frontend       | Externos                     | Fase   |
| ---- | ------------------------------ | ---------------------------------- | -------------- | ---------------------------- | ------ |
| 10.8 | Chatbot RAG                    | ❌ Stub `ai-service` existe, vazio | ❌ Não existe  | OpenAI/LangChain + LangGraph | 4      |
| 10.6 | Reuniões + Fathom              | ❌ Não começou                     | ❌ Não começou | Fathom webhook (HMAC)        | 4      |
| 10.7 | Scraping concorrentes          | ❌ Não começou                     | ❌ Não começou | scraping engine (n8n?)       | 4 ou 6 |
| 10.9 | Scraping leads (Google Places) | ❌ Não começou                     | ❌ Não começou | Google Places API            | 6      |

### Catálogos & Campanhas (Phase 5)

| §     | Módulo                 | Backend                                           | Frontend       | Externos                                  | Fase |
| ----- | ---------------------- | ------------------------------------------------- | -------------- | ----------------------------------------- | ---- |
| 10.5  | Catálogos PDF          | ❌ Não começou (schema `Bundle` existe sem rotas) | ❌ Não existe  | PDF gen (Puppeteer / react-pdf)           | 5    |
| 10.11 | Marketing campanhas    | ❌ Não começou                                    | ❌ Não começou | n8n workflows                             | 5-6  |
| 10.20 | Inbox WhatsApp + Email | ❌ Não começou                                    | ❌ Não começou | Evolution API (WhatsApp) + Resend inbound | 5    |
| 10.21 | Email Marketing        | ❌ Não começou                                    | ❌ Não começou | Resend + React Email                      | 5    |

### Automação & Crescimento (Phase 6)

| §     | Módulo            | Backend        | Frontend       | Externos                  | Fase |
| ----- | ----------------- | -------------- | -------------- | ------------------------- | ---- |
| 10.10 | Redes Sociais     | ❌ Não começou | ❌ Não começou | n8n + plataformas sociais | 6    |
| 10.11 | n8n control plane | ❌ Não começou | ❌ Não começou | n8n self-hosted           | 6    |

### Operação em Campo (Phase 7)

| §     | Módulo                     | Backend        | Frontend       | Externos                   | Fase |
| ----- | -------------------------- | -------------- | -------------- | -------------------------- | ---- |
| 10.17 | Rotas Comerciais + Visitas | ❌ Não começou | ❌ Não começou | Geocoding (Mapbox/Google?) | 7    |
| 10.19 | Comissões                  | ❌ Não começou | ❌ Não começou | —                          | 7    |
| 10.16 | Margens / Reports          | ❌ Não começou | ❌ Não começou | —                          | 7    |

---

## Por categoria transversal

### Auth & RBAC

- [x] Better Auth wired (Phase 0)
- [x] First-user-OWNER signup gate (com TODO de advisory lock)
- [x] `attachAuthContext` middleware + `requireRole`
- [x] ABAC SALES_REP filter em customers/leads
- [ ] 2FA TOTP em OWNER/ADMIN (plugin instalado, não wired) — Phase 8
- [ ] Better Auth invite endpoints testados com role enum custom — Phase 3 ou 5
- [ ] `pg_advisory_xact_lock` no signup gate (race teórica) — Phase 8

### Data layer

- [x] Prisma schema completo (Phases 0-2: 23 models)
- [x] Migrations aplicadas (3 migrations)
- [x] `audit_log` table + `writeAudit()` service
- [ ] AuditLog diff `{field: {before, after}}` (hoje grava input cru) — Phase 3 ou 8
- [ ] Schema para Phase 3+: `CustomerOrder`, `CustomerOrderLine`, `OrderStatusHistory`, `Quote`, `Invoice`, `Return`, `AlibabaOrder`, `AlibabaOrderItem`, `OrderShipment`...
- [ ] Schema para Phase 4+: `Embedding`, `Conversation`, `Message`, `Meeting`, `FathomEvent`, `Document`, `ScrapeRun`...
- [ ] Schema para Phase 5+: `Catalog`, `CatalogPage`, `Campaign`, `CampaignSegment`, `EmailTemplate`, `EmailSend`, `MessageThread`, `MessageInbound`, `MessageOutbound`...
- [ ] Schema para Phase 6+: `N8nWorkflow`, `SocialPost`, `LeadCandidate`...
- [ ] Schema para Phase 7+: `Route`, `RouteStop`, `Visit`, `CommissionRule`, `CommissionStatement`...

### Tests

- [x] Backend domain unit tests (suppliers scoring, customers lead-scoring, pricing price-floor, pricing resolve-price, stock safety-stock)
- [x] 15 tests verdes
- [ ] **Supertest HTTP integration tests** para os 5 módulos backend actuais — não existe nada — alta prioridade
- [ ] Race test de reservation concorrente (Phase 2 §7.5 invariante)
- [ ] Test do price floor em integration (Phase 2 §10.15)
- [ ] Frontend component tests (Vitest + Testing Library) — Phase 8
- [ ] e2e tests (Playwright) — Phase 8
- [ ] Load tests (k6) em pricing/stock/orders — Phase 8

### Backend HTTP gaps

- [ ] **Módulo `pricing` HTTP** (lists, lines, specials, resolve) — Phase 2 closure
- [ ] Módulo `orders` (Phase 3)
- [ ] Módulo `quotes` (Phase 3)
- [ ] Módulo `returns` (Phase 3)
- [ ] Módulo `alibaba` (Phase 3)
- [ ] Módulo `bundles` (schema existe, sem rotas) — Phase 5
- [ ] Módulo `catalogs` (Phase 5)
- [ ] Módulo `campaigns` (Phase 5)
- [ ] Módulo `inbox` / `messages` (Phase 5)
- [ ] Módulo `meetings` + Fathom webhook handler — Phase 4
- [ ] Módulo `routes` + `visits` — Phase 7
- [ ] Módulo `commissions` — Phase 7
- [ ] Módulo `reports` (margens/comissões/ABC) — Phase 7
- [ ] Mapping de erros Prisma → HTTP no errorHandler (`P2002`, `P2003`, `P2025`, PG `23514` CHECK) — pré-requisito de Supertest

### Frontend gaps

- [ ] Sidebar nav agrupada (actual: 5 entradas horizontais) — esta sessão
- [ ] Forms para Phase 1+2 entidades — esta sessão
- [ ] Páginas Stock + Pricing — esta sessão
- [ ] Placeholders para Phases 3-7 (com mocks) — esta sessão
- [ ] Dashboard real com KPIs — depende de §10.1 backend
- [ ] Inbox unificado UI — Phase 5
- [ ] Catálogo PDF preview — Phase 5
- [ ] Mobile/PWA layout para Phase 7 (visitas em campo)
- [ ] Component tests + e2e — Phase 8

### Integrações externas (ainda não wired)

- [ ] **OpenAI / Anthropic API** (RAG, vision) — Phase 4
- [ ] **LangChain + LangGraph** dentro do ai-service — Phase 4
- [ ] **pgvector** embeddings (extension habilitada, sem uso) — Phase 4
- [ ] **Resend** (transactional + marketing emails + inbound) — Phase 5
- [ ] **React Email** templates — Phase 5
- [ ] **Evolution API** (WhatsApp) + webhook handler com HMAC — Phase 5
- [ ] **n8n** self-hosted + control plane + HMAC webhooks — Phase 6
- [ ] **Fathom** webhook handler com HMAC — Phase 4
- [ ] **Google Places API** (lead scraping) — Phase 6
- [ ] **Alibaba** API ou scraping (estado a confirmar) — Phase 3
- [ ] **Geocoding** (Mapbox / Google) para visitas — Phase 7
- [ ] **Invoice provider** PT (Moloni / InvoiceXpress / Vendus — a decidir) — Phase 3
- [ ] **BullMQ + Redis** (job queue) — Phase 3 quando orders precisar de async

### Observabilidade & ops (§12, §14, §15 fase 8)

- [x] Pino logger com PII redact
- [x] Request ID middleware
- [x] GitHub Actions CI workflow per service (lint/typecheck/test/build)
- [ ] CI com Postgres service container (pré-requisito Supertest CI) — próxima sessão
- [ ] Health checks `/healthz`, `/readyz` (existem? confirmar) — Phase 0
- [ ] Tracing distribuído (OpenTelemetry) — Phase 8
- [ ] Métricas Prometheus / Grafana — Phase 8
- [ ] Sentry / error tracking — Phase 8
- [ ] Backups testados em DR — Phase 8
- [ ] Runbooks oncall — Phase 8
- [ ] Load test (k6) — Phase 8

### Dívida técnica conhecida

- [ ] `ai-service/src/*.js` + `*.js.map` tracked em git (commit `b27297a`, A7 Plan 1) — adicionar a `.gitignore` + `git rm --cached`
- [ ] `lint-staged.config.js` history split entre A2 e A3 — cosmético, sem fix
- [ ] `exactOptionalPropertyTypes: false` nos tsconfigs — reavaliar Phase 8
- [ ] Schemas Zod duplicados backend ↔ frontend (consequência ADR-0002) — sem fix, aceite
- [ ] Modelos Phase 1 sem UI: bundles (schema), returns/routes/visits (não existem ainda) — fechar via Phase 5+

---

## Sugestões de priorização

### A — Próxima sessão imediata (depois desta)

1. **Cleanup ai-service .js artifacts** (~10 min, desbloqueia CI)
2. **Brainstorming /brainstorming** sobre que features atacar primeiro depois do skeleton — decisão estratégica de produto

### B — Curto prazo (1-2 sessões)

1. **Módulo HTTP `pricing`** + **Supertest integration tests** (Phase 2 closure original)
2. **Schema + módulos Phase 3** (CustomerOrder, FSM, reservas atómicas — invariantes críticas do produto)
3. **Forms reais Phase 1+2** com `react-hook-form` (substituir mocks do skeleton)

### C — Médio prazo (próximo mês)

1. Phase 4 — RAG read-only (alto valor, sem alterar invariantes; ai-service ganha vida)
2. Phase 5 parcial — Email transacional (Resend) para sign-up/invite
3. Phase 5 — Inbox unificado WhatsApp+Email (alto valor B2B floristry — WhatsApp é o canal primário)

### D — Quando houver bandwidth

1. Phase 6 (automação)
2. Phase 7 (rotas/visitas — exige mobile)
3. Phase 8 (hardening — antes de produção real)

---

## Como usar este documento

- Quando uma feature passa de pendente para feita, marcar com ✅ e mover para o resumo.
- Quando descobres uma feature nova / requirement, adicionar à secção da fase correspondente.
- Decisões arquitecturais importantes → ADR em `docs/decisions/`.
- Quando uma dívida técnica é resolvida, riscar do "Dívida técnica conhecida" e mover para o changelog do HANDOFF.
