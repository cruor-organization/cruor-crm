# Fase 0 — Bootstrap

Concluída em 2026-05-10. Layout posteriormente reestruturado de monorepo para 3 pastas standalone (ver [ADR-0002](./decisions/0002-layout-3-pastas-standalone.md)).

## Entregue

| Camada | Estado | Notas |
|---|---|---|
| Estrutura `backend/` `frontend/` `ai-service/` | ✅ | Cada uma standalone, sem pnpm workspace nem Turborepo. |
| TypeScript strict por serviço | ✅ | `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `noImplicitOverride`. |
| ESLint 9 flat por serviço | ✅ | Inline em cada `eslint.config.js`. Regra para banir `$queryRawUnsafe`/`$executeRawUnsafe` no backend. |
| Prettier + EditorConfig | ✅ | Partilhado a partir da raiz. |
| Prisma + pgvector | ✅ | `backend/prisma/schema.prisma`. Tabelas Better Auth (user/session/account/verification/organization/member/invitation). |
| Better Auth | ✅ | Email+password, plugins organization + admin, signup gate (primeiro user = OWNER). |
| Backend Express | ✅ | Helmet, CORS, hpp, compression, Pino com redact PII, rate-limit `/api/auth/*`, `/healthz`, `/readyz`, `/me`, error middleware tipado. |
| Frontend Vite + TanStack | ✅ | File-based router (`/sign-in`, `/sign-up`, `/`), Tailwind v3, react-hook-form + Zod. |
| AI service stub | ✅ | `/healthz` + `/readyz`. LangChain entra em Fase 4. |
| Dockerfiles | ✅ | Um por serviço, multi-stage com pnpm fetch cache. |
| docker-compose Coolify | ✅ | 3 builds independentes (`context: ../{backend,frontend,ai-service}`). |
| Supabase CLI local | ✅ | `supabase/config.toml` — GoTrue/Storage/Realtime desligados. |
| Husky + commitlint | ✅ | Hooks no root, pre-commit `lint-staged`. |
| CI GitHub Actions | ✅ | Matrix de 3 jobs paralelos. Backend com Postgres pgvector como service. |

## Fora de scope (defer)

- **Migrações Prisma commitadas** — geradas localmente. Phase 1 commita a primeira migração com entidades de domínio.
- **Entidades de domínio** (Customer, Product, Stock...) — Fase 1+.
- **2FA TOTP** — fixo em §5 mas é Fase 1.
- **Membership com enum §8** — Better Auth `member.role` é string. Fase 1 mapeia para o enum do domínio.
- **Resend, Evolution API, Stripe, Moloni, Fathom, n8n** — entram nas respetivas fases.

## Verificação (DoD)

```bash
# 1. Dependências
pnpm install        # root (husky, commitlint, prettier, concurrently)
pnpm install:all    # cada serviço

# 2. Postgres local
supabase start    # Postgres 54322, Studio 54323

# 3. Migração inicial
pnpm db:migrate:dev

# 4. Tudo a correr
pnpm dev          # concurrently backend :3001, frontend :5173, ai :3002

# 5. Verificações HTTP
curl -s http://localhost:3001/healthz
curl -s http://localhost:3001/readyz
curl -s http://localhost:3002/healthz

# 6. Browser
# http://localhost:5173/sign-up → criar conta → redirect para /
# Incógnito, /sign-up de novo → erro SIGNUP_DISABLED

# 7. Pipeline
pnpm lint && pnpm typecheck && pnpm test && pnpm build
```

## Riscos conhecidos

1. **Race na signup gate**: documentado; Phase 1 fecha com advisory lock Postgres.
2. **Migrações Prisma não commitadas** ainda — primeira corrida exige `pnpm db:migrate:dev`.
3. **TanStack Router `routeTree.gen.ts`** é gitignored; `tsr generate` corre antes de typecheck/build.
4. **Duplicação cross-serviço** se ai-service precisar de `AppError`/`Result` (vide ADR-0002).

## Próximo passo

Phase 1 (Núcleo Comercial — §10.2, §10.3, §10.4):
- Schema com Customer, CustomerLead, Supplier, Product, ProductVariant, ProductMedia, ProductVote.
- CRUD + Zod schemas + repository/service.
- Mapping Membership ↔ Better Auth role.
- 2FA TOTP em OWNER/ADMIN.
