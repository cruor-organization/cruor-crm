# Handoff — estado do projeto

Última atualização: **2026-06-10**.

Doc vivo para retomar o trabalho noutra sessão (potencialmente noutro agente Claude). Mantém-no atualizado quando passares uma fase.

---

## TL;DR

- **Fases 0–3 entregues e commitadas.** Fase 4 (Conteúdo & IA) em curso — **slice 1
  (Fundação RAG + Chatbot texto) entregue** nesta sessão (§10.8). Ver o changelog em
  [02-remaining-work.md](./02-remaining-work.md) (sessão 2026-06-10).
- **Phase gate ativo**: os slices seguintes da Fase 4 (reuniões+Fathom, AI vision,
  similaridade visual, tools de escrita/DRAFT) **não** devem começar sem confirmação.
- **Desvio §0 registado:** o LLM do chatbot é **OpenAI**, não Claude — [ADR-0003](./decisions/0003-openai-para-chatbot-llm.md).
  Embeddings mantêm-se OpenAI `text-embedding-3-small`. Provider tem modo `mock` (CI/E2E
  sem keys) e `live` atrás de `AI_PROVIDER`.
- Stack standalone em 3 pastas (`backend/`, `frontend/`, `ai-service/`) — sem pnpm workspace, sem Turborepo. Deviação consciente do `prompt.md` §4; razão em [ADR-0002](./decisions/0002-layout-3-pastas-standalone.md).
- **Nota de ambiente:** só o Node **v24.16.0** está instalado no nvm (o `.nvmrc` fixa 20,
  mas o 20/22 não estão presentes); os engines `<23` dão só warning. O shim
  `node_modules/.bin/*` pode não ter bit de execução — invocar binários via
  `node node_modules/<pkg>/...`. Se os tipos do Express "partirem" no ai-service, é
  linkagem pnpm stale: `CI=1 pnpm install --config.confirmModulesPurge=false`.

---

## Estado atual dos serviços

Quando a sessão anterior terminou, os processos abaixo estavam **vivos em background**. Provavelmente já caíram (Docker pode estar reiniciado, processos `tsx watch`/`vite` morrem com a sessão).

| Serviço                  | Porta    | Como verificar                             |
| ------------------------ | -------- | ------------------------------------------ |
| Supabase Postgres (CLI)  | `:54322` | `supabase status`                          |
| Supabase Studio          | `:54323` | `curl http://127.0.0.1:54323`              |
| Backend Express + Prisma | `:3001`  | `curl http://localhost:3001/healthz`       |
| Frontend Vite            | `:5173`  | `curl -o /dev/null http://localhost:5173/` |
| AI service stub          | `:3002`  | `curl http://localhost:3002/healthz`       |

**OWNER já existe na DB:** `tiagosousa.tams@hotmail.com` (password definida na sessão anterior, ver Slack/notas locais). Signup público está fechado (gate ativada após primeiro user).

---

## Retomar do zero

```bash
cd ~/Documents/empresa-sem-nome

# 1. Ferramentas necessárias (todas já instaladas; lista para sanity check)
node --version          # v20+ (estamos em v22 mas .nvmrc fixa 20)
pnpm --version          # 9.15.9
supabase --version      # 2.98.2 (em ~/.local/bin/supabase)
docker info | head -3   # daemon a correr

# 2. Stack local
supabase start
# Se não houver migrações aplicadas:
pnpm -C backend exec prisma migrate deploy

# 3. Confirma DB
PGPASSWORD=postgres psql -h 127.0.0.1 -p 54322 -U postgres -d postgres -c "\dt public.*"
# Devem aparecer 18 tabelas (8 Better Auth + 10 domínio + audit_log + _prisma_migrations)

# 4. Arrancar tudo
pnpm dev
# ou individualmente:
#   pnpm dev:backend / dev:frontend / dev:ai

# 5. Smoke test
curl -s http://localhost:3001/healthz  # {"status":"ok","service":"backend"}
curl -s http://localhost:3001/readyz   # {"status":"ok","checks":{"db":"ok"}}
```

Login OWNER no browser: `http://localhost:5173/sign-in`. Se a password se perder, `supabase db reset` + criar de novo (perde os fornecedor/customer/lead/produto de teste — todos eles eram dados de validação, não importam).

---

## Onde está o quê

```
empresa-sem-nome/
├── backend/                              # Express + Prisma + Better Auth
│   ├── prisma/
│   │   ├── schema.prisma                 # 18 tabelas — núcleo + domínio Fase 1
│   │   └── migrations/
│   │       ├── 20260510_init/            # Better Auth + pgvector
│   │       └── 20260510_phase_1_domain/  # Supplier, Customer, Lead, Product, Bundle, AuditLog
│   ├── src/
│   │   ├── index.ts                       # entry (dotenv import)
│   │   ├── app.ts                         # Express setup, monta routers
│   │   ├── config/env.ts                  # Zod validation da env
│   │   ├── logger.ts                      # Pino com PII redact
│   │   ├── auth/                          # Better Auth + signup gate
│   │   ├── db/                            # Prisma client singleton
│   │   ├── shared/                        # AppError, Result, RBAC enum
│   │   ├── domain/                        # lógica pura (scoring, etc.)
│   │   │   ├── suppliers/scoring.ts
│   │   │   └── customers/lead-scoring.ts
│   │   ├── middlewares/
│   │   │   ├── auth-context.ts            # requireAuth, requireRole
│   │   │   ├── async-handler.ts           # wrapper para Express 4
│   │   │   ├── error.ts                   # AppError → JSON
│   │   │   └── request-id.ts
│   │   ├── modules/                       # vertical slices Fase 1
│   │   │   ├── suppliers/   (routes/controller/service/repository/schemas)
│   │   │   ├── customers/
│   │   │   ├── leads/
│   │   │   ├── products/
│   │   │   └── audit/audit.service.ts
│   │   ├── routes/                        # health, /me (cross-cutting)
│   │   └── types/express.d.ts             # augmenta Request com ctx
│   └── tests/health.test.ts
├── frontend/                              # Vite + TanStack + Tailwind
│   └── src/
│       ├── lib/{api.ts, auth-client.ts}
│       └── routes/                        # file-based router
│           ├── __root.tsx                 # navbar global
│           ├── index.tsx                  # dashboard placeholder
│           ├── sign-in.tsx, sign-up.tsx
│           ├── customers.tsx              # tabela
│           ├── leads.tsx                  # Kanban 6 colunas
│           ├── suppliers.tsx              # tabela
│           └── products.tsx               # tabela com decisão/score
├── ai-service/                            # stub para Fase 4
├── supabase/config.toml                   # GoTrue/Storage off, Postgres 17
├── docker/docker-compose.prod.yml         # 3 builds independentes (Coolify)
├── docs/
│   ├── 00-bootstrap.md                    # Fase 0
│   ├── 01-phase-1.md                      # Fase 1 — leitura recomendada antes de continuar
│   ├── architecture.md
│   ├── HANDOFF.md                         # este ficheiro
│   └── decisions/
│       ├── 0001-better-auth-com-supabase-postgres.md
│       └── 0002-layout-3-pastas-standalone.md
├── package.json                           # root slim: husky + concurrently
└── CLAUDE.md                              # instruções para o agente
```

---

## Decisões importantes (não esquecer)

1. **ADR-0002** — Layout 3-folder standalone, sem workspace. Deviação consciente do prompt §4. Custo aceito: duplicação se ai-service vier a precisar de `shared/errors`.
2. **Better Auth** é a única fonte de auth; GoTrue do Supabase está **desligado** no `supabase/config.toml`. Não ligar.
3. **`member.role`** guarda valores `OWNER`/`ADMIN`/`SALES_MANAGER`/etc. (§8 enum), **não** os defaults Better Auth ("owner"/"admin"). Quando wirares invites em Phase 2, podes ter de configurar `roles: { custom: [...] }` no plugin organization — **não testado ainda**.
4. **`exactOptionalPropertyTypes: false`** nos dois tsconfigs. Foi pragmatismo (Prisma + Zod fricção). Documentado nos próprios tsconfigs.
5. **`routeTree.gen.ts`** é gitignored — o `tsr generate` corre antes de `typecheck`/`build`. Não committar.

---

## Verificação pipeline (passa, pronto a commitar)

```bash
pnpm -C backend lint        # 0 errors (2 warnings de import order em tests, intencionais)
pnpm -C backend typecheck   # OK
pnpm -C backend test        # 15 testes pass
pnpm -C backend exec tsc -p tsconfig.build.json   # build OK

pnpm -C frontend lint       # 0 errors
pnpm -C frontend typecheck  # OK
pnpm -C frontend build      # OK (dist/ gerado com chunks separados por rota)

pnpm -C ai-service lint     # OK
pnpm -C ai-service typecheck # OK
pnpm -C ai-service build    # OK
```

---

## Pendente / dívida técnica (priorizado)

| #   | Item                                                                                                                 | Onde            |
| --- | -------------------------------------------------------------------------------------------------------------------- | --------------- |
| 1   | **Commits.** Nada está commitado. Sugestão de splits abaixo.                                                         | —               |
| 2   | **Forms de criação no frontend.** Só há listings. Sem botão "Novo Customer/Supplier/Lead/Product".                   | Fase 2 paralelo |
| 3   | **Tests de integração HTTP (Supertest)** para os 4 módulos Fase 1. Só temos unit tests do domain.                    | Fase 2          |
| 4   | **2FA TOTP** em OWNER/ADMIN. Plugin admin instalado mas sem TOTP wired.                                              | Fase 2          |
| 5   | **Race signup gate.** `pg_advisory_xact_lock` no `before` hook.                                                      | Fase 2          |
| 6   | **Better Auth invite endpoints** com `member.role = OWNER`. Não testado.                                             | Fase 2          |
| 7   | **AuditLog diff** ({field: {before, after}}). Hoje grava o input cru.                                                | Fase 2/3        |
| 8   | **`pnpm-lock.yaml`** ainda não regenerado a partir do layout standalone. Cada serviço tem o seu. CI usa per-service. | —               |
| 9   | **Bundle module** tem schema mas zero rotas/serviço. Defer Fase 5 (catálogos).                                       | Fase 5          |

---

## Sugestão de commits (Conventional Commits, §17)

Por ordem de aplicação. Cada um é uma unidade revisível.

```
1. chore: switch to 3-folder standalone layout (drop pnpm workspace + turbo)
2. chore(backend): pnpm + tsconfig + eslint + Dockerfile baseline
3. chore(frontend): pnpm + tsconfig + eslint + Dockerfile baseline
4. chore(ai-service): pnpm + tsconfig + eslint + Dockerfile baseline
5. feat(db): prisma schema + init migration (better-auth + pgvector)
6. feat(auth): better-auth server + first-user-OWNER signup gate
7. feat(backend): express app skeleton (helmet, pino, rate-limit, healthz)
8. feat(frontend): vite + tanstack router + auth client + sign-in/up
9. ci: github actions matrix (backend/frontend/ai-service)
10. docs: bootstrap notes, architecture, ADR-0001
11. feat(db): phase 1 schema + migration (suppliers, customers, leads, products, bundles, audit)
12. feat(rbac): app roles + auth-context middleware (§8)
13. feat(domain): supplier scoring + lead scoring (§10.2, §10.3)
14. feat(suppliers): CRUD module
15. feat(customers): CRUD + activities timeline + ABAC SALES_REP
16. feat(leads): kanban CRUD + atomic Lead→Customer conversion
17. feat(products): CRUD + multi-sócio decision + voting
18. feat(audit): writeAudit service for sensitive mutations
19. feat(frontend): phase 1 listings (customers, leads kanban, suppliers, products) + nav
20. docs: phase 1 notes + ADR-0002 + handoff
```

Podes agrupar 1–4 num só "chore: bootstrap repo layout" se preferires menos commits.

---

## Próxima fase (Fase 4 — slices restantes)

> Esta secção descrevia originalmente a Fase 2; mantida abaixo por referência
> histórica. As Fases 2 e 3 estão concluídas. O próximo trabalho são os slices
> restantes da Fase 4 (cada um atrás do phase gate):
>
> - **Slice 2 — Reuniões + Fathom** (§10.6): modelo `Meeting`, webhook HMAC +
>   idempotência, auto-link a `Customer`/`CustomerActivity`, embeddings de
>   transcript (`sourceType=MEETING`). **Reavaliar Redis/BullMQ aqui** (transcripts
>   são grandes; a ingestão de produtos do slice 1 ficou síncrona de propósito).
> - **Slice 3 — AI vision** (§10.4): análise de fotos de produto + embeddings
>   visuais (`PRODUCT_VISUAL`) → desbloqueia `findVisuallySimilarProducts`.
>   Pré-requisito de segurança: validação SSRF do `photoUrl` (allowlist + bloqueio
>   de IPs privados, §9).
> - **Slice 4 — Tools de escrita** (§10.8): `draftQuoteForCustomer` (DRAFT only,
>   confirmação na UI) + `getMetric`, `suggestSeasonalCatalog`, `recommendSubstitute`.
>
> ---
>
> ### Histórico (Fase 2, já concluída)

Spec em `prompt.md` §10.13 (stock) e §10.15 (pricing). Resumo:

- `StockLocation` (PT_PORTO, PT_LISBOA, ES_BARCELONA por defeito)
- `StockLevel(variantId, locationId, qty)` com `CHECK qty >= 0` (hard invariant §7.5)
- `StockMovement` (IN/OUT/RESERVE/RELEASE/ADJUST/RETURN) com auditoria
- `PriceList` por (tier, currency, validFrom/validTo) → linhas por variant
- `CustomerSpecialPrice` para overrides individuais
- `resolvePrice(ctx, variantId, customerId, qty)` em `domain/pricing/`
- Invariante crítica §10.4: preço final **≥ landed cost × 1.10** ou lança `ValidationError("PRICE_BELOW_FLOOR")`
- Reservas atómicas: `SELECT ... FOR UPDATE` em `prisma.$transaction`
- Job de alerta safety stock (BullMQ — ainda não temos Redis; ver decisão abaixo)

**Decisão preliminar a tomar antes de começar Fase 2:**

- BullMQ + Redis entra agora ou só em Fase 3 (encomendas)? Para alertas de safety stock pode ser síncrono primeiro (calculado em request) e migrar para job depois. Tendo a preferir adiar Redis para Fase 3.

---

## Como abrir esta sessão num agente novo

1. O agente lê `CLAUDE.md` automaticamente.
2. **Pede-lhe expressamente para ler `docs/HANDOFF.md` e `docs/01-phase-1.md`** antes de tocar em código.
3. Confirma que ele percebe o estado: "estamos a entrar em Fase 2; Phase 1 está concluída e validada; nada commitado".
4. Se o objetivo é commitar primeiro, dá-lhe a lista de commits acima. Se for atacar Fase 2, primeiro confirma scope (BullMQ sim/não).

---

## Outras notas

- Supabase **2.98.2** deprecated Postgres 16; usa 17. Já refletido em `supabase/config.toml`.
- `tsx watch --env-file=.env` tem bug com `.js→.ts` resolution. Resolvido com `import 'dotenv/config'` no `index.ts`.
- `dotenv@^16` é dep do backend e do ai-service.
- Husky hooks instalam-se ao correr `pnpm install` no **root** (não nos serviços). `commitlint` valida mensagens.
