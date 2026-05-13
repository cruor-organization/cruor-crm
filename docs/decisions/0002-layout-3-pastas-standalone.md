# ADR-0002 — Layout: 3 pastas standalone em vez de monorepo pnpm workspace

- Estado: aceite
- Data: 2026-05-10
- Fase: 0 (Bootstrap, revisão pós-implementação)

## Contexto

O Master Prompt v3 (§4) define explicitamente:

```
crm/
├── apps/
│   ├── backend/
│   ├── frontend/
│   └── ai-service/
├── packages/
│   ├── db/
│   ├── shared/
│   ├── auth/
│   ├── domain/
│   └── config/
```

Esta estrutura é a típica de um monorepo pnpm + Turborepo, com workspace packages partilhados entre apps.

Após a implementação inicial da Fase 0 sob este layout, o utilizador pediu uma reestruturação para **3 pastas standalone** (`backend/`, `frontend/`, `ai-service/`), sem `apps/`, sem `packages/`, sem `pnpm-workspace.yaml`, sem Turborepo.

## Decisão

**Desviamos do §4** e adotamos 3 pastas standalone na raiz. Cada pasta:

- Tem o seu próprio `package.json`, `node_modules`, `pnpm-lock.yaml`.
- Tem o seu próprio `tsconfig.json` e `eslint.config.js` (sem extends de uma pasta vizinha).
- Pode ser deployada de forma totalmente independente.

O código que estava em `packages/*` foi reagrupado **dentro do `backend/src/`**:

- `packages/shared` → `backend/src/shared/`
- `packages/db` → `backend/src/db/`
- `packages/auth` → `backend/src/auth/`
- `packages/domain` → `backend/src/domain/`
- `packages/config` → eliminado (cada serviço inlina o seu ESLint flat config e tsconfig)

A `prisma/` saiu de dentro do package e ficou em `backend/prisma/` (convenção Prisma).

## Justificação

Argumentos do utilizador (literalmente: "fica mais clean e organizado", "é fácil de dar deploy"):

1. **Deploy simples**: em Coolify cada pasta é um Application separado com o seu Dockerfile no root da pasta. Sem necessidade de `context: ..` em compose, sem pacotes workspace para resolver no Docker build.
2. **Encapsulamento mental**: ao abrir `backend/` só se vê código de backend; sem o ruído de packages que vivem fora.
3. **Independência de versionamento**: o frontend pode atualizar Vite sem mexer no backend; cada `pnpm-lock.yaml` é isolado.

Custos aceites:

1. **Duplicação**: se o ai-service vier a precisar dos `AppError`/`Result` que vivem em `backend/src/shared/`, o código terá de ser copiado. Em Fase 4 reavaliamos (provavelmente extraindo via `npm link` local ou criando um package privado mínimo).
2. **Sem turbo cache**: cada CI job corre os passos completos. Em projetos pequenos isto é < 2 min, aceitável.
3. **Conventional Commits + Husky**: o `husky` instala-se a partir do root `package.json`, então é preciso correr `pnpm install` no root **uma vez** para ativar hooks. Documentado no README.

## Consequências

- **Domínio puro (`backend/src/domain/`)** vive dentro do backend. Quando precisarmos do mesmo cálculo em ai-service (ex.: scoring de leads na Fase 1 / Fase 6), opções:
  - (a) duplicar o código (preferível enquanto o módulo de domínio for pequeno);
  - (b) extrair para `shared/` na raiz e importar via path relativo (rompe o "standalone");
  - (c) publicar como package privado (`@local/domain`) via `pnpm link --global` ou registry interno.
  - **Plano**: começamos por (a). Reavaliar em Fase 4.

- **Schemas Zod** (request/response) replicados se houver partilha frontend↔backend. Em Fase 1 vamos manter Zod schemas no backend; o frontend define os seus próprios (TanStack Router + react-hook-form). Aceitamos pequena duplicação em troca de zero acoplamento.

- **CI**: matrix de 3 jobs paralelos (backend / frontend / ai-service). Backend precisa de Postgres pgvector como service container.

- **Deploy Coolify**: 3 applications. Backend faz `prisma migrate deploy` no startup. Frontend serve via nginx.

## Alternativas consideradas

| Opção | Por que rejeitada |
|---|---|
| **Manter monorepo § 4 com pnpm workspace + Turborepo** | Mais "limpo do ponto de vista DRY" mas o utilizador explicitou preferência por standalone. Preferência do dono do projeto vence. |
| **Monorepo "flat" (apps em workspace mas sem packages)** | Comprimento de meio-caminho que herda complexidade do pnpm workspace sem dar full standalone. |
| **Single repo, single package.json com pastas** | Mistura deps de browser e Node num único node_modules; complica TS module resolution e pinning. |

## Referências

- `prompt.md` §4 (layout original prescrito)
- `CLAUDE.md` — "Instruction Priority": instruções do utilizador prevalecem sobre o prompt
- `package.json` (root) — scripts `dev`, `install:all` para orquestrar os 3 serviços
- `.github/workflows/ci.yml` — matrix de jobs por serviço
- `docker/docker-compose.prod.yml` — 3 builds independentes
