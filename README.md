# CRM Florista B2B

CRM interno para grossista B2B de florista (PT/ES). Especificação completa em [`prompt.md`](./prompt.md) (Master Prompt v3).

## Estado atual

**Fase 0** completa. **Fase 1** (Núcleo Comercial) em curso.

## Estrutura

Três serviços standalone, sem monorepo workspace (decisão registada em [ADR-0001](./docs/decisions/0001-better-auth-com-supabase-postgres.md) e [ADR-0002](./docs/decisions/0002-layout-3-pastas-standalone.md)):

```
empresa-sem-nome/
├── backend/        # Express + Prisma + Better Auth (porta 3001)
│   ├── src/
│   │   ├── auth/         # Better Auth server + signup gate
│   │   ├── db/           # Prisma client singleton
│   │   ├── shared/       # AppError + Result
│   │   ├── domain/       # Lógica de negócio pura
│   │   ├── modules/      # CRUD por módulo (Phase 1+)
│   │   ├── middlewares/
│   │   ├── routes/
│   │   ├── config/env.ts
│   │   └── ...
│   ├── prisma/schema.prisma
│   └── tests/
├── frontend/       # React + Vite + TanStack (porta 5173)
│   └── src/
│       ├── routes/   # file-based router
│       ├── lib/      # auth-client, api wrappers
│       └── ...
├── ai-service/     # LangChain stub para Phase 4 (porta 3002)
├── supabase/       # CLI config (Postgres + Studio em local dev)
├── docker/         # docker-compose.prod.yml para Coolify
├── docs/           # ADRs e notas
├── .github/workflows/
├── prompt.md
└── CLAUDE.md
```

Cada serviço tem o seu **próprio `package.json`, `node_modules` e `pnpm-lock.yaml`**. Deploy independente por pasta.

## Stack (§5 do prompt)

- Node 20 LTS, TypeScript estrito, pnpm.
- Backend: Express 4 + Prisma + Supabase Postgres + pgvector + Better Auth + Pino + Zod.
- Frontend: React 18 + Vite + TanStack (Router/Query) + Tailwind + Better Auth client.
- AI Service: Node + Express (LangChain entra na Phase 4).

## Pré-requisitos

| Ferramenta   | Versão          | Como instalar                                                                  |
| ------------ | --------------- | ------------------------------------------------------------------------------ |
| Node         | 20 LTS (até 22) | [nvm](https://github.com/nvm-sh/nvm) + `nvm use`                               |
| pnpm         | 9.x             | `npm install -g pnpm@9`                                                        |
| Docker       | 24+             | requerido pelo Supabase CLI                                                    |
| Supabase CLI | 1.226+          | [docs](https://supabase.com/docs/guides/local-development/cli/getting-started) |

## Setup inicial

```bash
# 1. Dependências (root para husky/commitlint + cada serviço)
pnpm install
pnpm install:all

# 2. Variáveis de ambiente — copiar e editar em cada serviço
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
cp ai-service/.env.example ai-service/.env

# 3. Postgres local
supabase start    # Postgres 54322, Studio 54323

# 4. Migração inicial (Better Auth tables + pgvector)
pnpm db:migrate:dev    # = pnpm -C backend db:migrate:dev

# 5. Arrancar tudo (em paralelo via concurrently)
pnpm dev
# ou individualmente:
#   pnpm dev:backend
#   pnpm dev:frontend
#   pnpm dev:ai
```

## Comandos úteis

```bash
pnpm dev              # tudo em paralelo
pnpm lint             # ESLint nos 3 serviços
pnpm typecheck        # tsc --noEmit nos 3
pnpm test             # vitest nos serviços com testes
pnpm build            # build de produção
pnpm format           # Prettier em tudo
pnpm db:studio        # Prisma Studio (porta 5555)
pnpm db:reset         # cuidado: apaga tudo
```

## Primeiro login

1. `http://localhost:5173/sign-up` → criar conta — **primeiro user fica OWNER da organização default**
2. `/sign-up` de novo → 403 `SIGNUP_DISABLED` (gate ativa após o primeiro)
3. `/sign-in` com as credenciais do OWNER

## Fases (§15)

- [x] **Fase 0** — Bootstrap
- [x] **Fase 1** — Núcleo Comercial (RBAC + Suppliers + Customers + Leads + Products)
- [ ] Fase 2 — Stock & Pricing
- [ ] Fase 3 — Encomendas (FSM)
- [ ] Fase 4 — Conteúdo & IA (RAG, Fathom)
- [ ] Fase 5 — Catálogos & Campanhas
- [ ] Fase 6 — Automação & Crescimento
- [ ] Fase 7 — Operação em Campo
- [ ] Fase 8 — Hardening

`phase_gate: true` — não avançar para a fase seguinte sem confirmação explícita.
