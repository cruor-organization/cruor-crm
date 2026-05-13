# ADR-0001 — Better Auth como fonte de verdade, Supabase só para Postgres

- Estado: aceite
- Data: 2026-05-10
- Fase: 0 (Bootstrap)

## Contexto

O Master Prompt v3 (§0, §5) fixa duas decisões:

- `db_provider: "supabase-postgres"`
- `auth: "better-auth"`

A stack Supabase inclui o seu próprio sistema de autenticação (GoTrue), pelo que há sobreposição com Better Auth. Em paralelo, escolheu-se `supabase` (CLI) para correr Postgres + pgvector em desenvolvimento local.

## Decisão

**Better Auth é a única fonte de verdade para autenticação e identidade**. Supabase é tratada como um Postgres gerido (com pgvector e Studio). Os módulos Auth, Storage, Realtime, Edge Functions e Analytics do Supabase ficam **desligados** em `supabase/config.toml`.

## Justificação

1. **Controlo total do modelo RBAC** (§8). Better Auth tem `organization` + `admin` plugins que dão `member.role` com valores arbitrários. O enum exigido em §8 (`OWNER`, `ADMIN`, `SALES_MANAGER`, `SALES_REP`, `WAREHOUSE`, `MARKETING`, `VIEWER`) é diretamente mapeável; o RLS do Supabase + GoTrue claims seria mais rígido e exigiria duplicar metadados.
2. **Hooks de domínio** (§10.x few-shots). A signup gate desta fase (e a 2FA forçada em OWNER/ADMIN da Fase 1) precisa de `databaseHooks` do Better Auth com transações Prisma. Supabase Auth executa noutro processo; sincronizar seria ginástica.
3. **Multi-tenant explícito** (§7.5 hard invariant). Better Auth `member.organizationId` mapeia 1:1 para o `organizationId` que aparece em todas as tabelas de domínio. Com Supabase Auth precisaríamos de policies RLS por tabela; já temos a invariante no código.
4. **Webhooks Resend, Evolution, n8n, Fathom** (§9, §10.20) assinam por HMAC e idempotent por `eventId`. Não precisamos do triggering do Supabase. Mais um motivo para não acoplar.
5. **Custo cognitivo**: uma fonte de verdade para sessões evita bugs do tipo "user existe no GoTrue mas não no Prisma".

## Consequências

- Em **dev local**, `supabase start` levanta a stack toda. Os módulos extra (Storage, Realtime, etc.) ficam off no `config.toml` para reduzir RAM.
- Em **produção (Coolify + Supabase Cloud)**, usamos o `DATABASE_URL` Supabase mas não criamos utilizadores no painel Auth. Documentar isto no runbook quando chegar Fase 8 (Hardening).
- Migração futura: se um dia quisermos um portal B2B público (§0 `b2b_portal_enabled: false`, mas Fase 6+ planeia), continuamos a usar Better Auth — só adicionamos `Customer` como entidade autenticável separada (já está nas Hard Invariants do CLAUDE.md).
- **Cuidado**: não habilitar `[auth]` no `supabase/config.toml` sem reescrever este ADR.

## Alternativas consideradas

| Opção | Por que rejeitada |
|---|---|
| **Supabase Auth (GoTrue) sozinho** | Não respeita §5 (better-auth fixo). Hooks de domínio mais frágeis. |
| **Auth.js (NextAuth)** | Não respeita §5. Sem suporte first-class para `organization`. |
| **Lucia v3** | Maintainer arquivou o projeto em 2024. |
| **Clerk / Auth0** | SaaS externo, custo recorrente, dependência de internet em dev. |

## Referências

- `prompt.md` §0 (`auth: "better-auth"`), §5 (Better Auth com organizations + admin + 2FA), §8 (RBAC).
- `supabase/config.toml` — `[auth] enabled = false`.
- `packages/auth/src/server.ts` — config do Better Auth.
