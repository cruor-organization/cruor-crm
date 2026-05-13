# Phase 2 Closure — Plan 1 of 4: Git History Bootstrap

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Initialize the GitHub remote and create 9 commits (1 init + 7 retroactive anchors + 1 spec/plan docs) that capture the existing Phase 0/1/2-baseline working tree in a coherent history before any new code is written.

**Architecture:** First commit (README only) → push to remote → 7 retroactive anchor commits matching spec § 6.2 sequence (A1-A7) → 1 commit for the design spec + this plan series (A8). Each commit is pushed immediately to `main`. The `schema.prisma` is **temporarily pruned** in A3 to Phase 0 only, restored to Phase 1 state in A5, and to final state in A6 — this is the most delicate part of the plan.

**Tech Stack:** git, GitHub remote `git@github.com:cruor-organization/cruor-crm.git`, husky pre-commit hooks (commitlint conventional commits), Prisma CLI for schema validation.

**Plan series:** This is plan 1 of 4 for Phase 2 closure:

1. **Git history bootstrap** (this plan) → 9 commits in `main`
2. Backend Phase 2 closure — Prisma error mapping + pricing module + ~30 Supertest tests
3. Frontend Phase 2 closure — form helpers + 6 forms + 2 pages
4. Phase 2 closure docs — handoff + retrospective

**Reference spec:** `docs/superpowers/specs/2026-05-13-phase-2-closure-design.md` § 6.

---

## File map

This plan **does not create any new source files**. It manipulates git state and temporarily edits `backend/prisma/schema.prisma` for the 3-step schema evolution (A3 → A5 → A6).

Files involved:

- `README.md` (commit init)
- `prompt.md`, `CLAUDE.md` (A1)
- Root tooling: `package.json`, `pnpm-lock.yaml`, `.editorconfig`, `.nvmrc`, `.gitignore`, `.env.example`, `commitlint.config.js`, `lint-staged.config.js`, `prettier.config.js`, `.husky/**`, `.github/**`, `docker/**`, `supabase/config.toml`, `docs/architecture.md`, `docs/00-bootstrap.md`, `docs/decisions/0001-better-auth-com-supabase-postgres.md`, `docs/decisions/0002-layout-3-pastas-standalone.md` (A2)
- `backend/**` excluding `node_modules`, `dist`, `.env`, and excluding modules/migrations beyond Phase 0; `schema.prisma` **pruned** (A3)
- `frontend/**` excluding `node_modules`, `dist`, `.env` (A4)
- `backend/prisma/migrations/20260510_phase_1_domain/`, `backend/src/modules/{suppliers,customers,leads,products,audit}/`, `backend/src/domain/{suppliers,customers}/`, `schema.prisma` extended to Phase 1 (A5)
- `backend/prisma/migrations/20260511_phase_2_stock_pricing/`, `backend/src/modules/stock/`, `backend/src/domain/{stock,pricing}/`, `schema.prisma` final (A6)
- `docs/HANDOFF.md`, `docs/01-phase-1.md`, `ai-service/**`, `README.md` final updates (A7)
- `docs/superpowers/specs/2026-05-13-phase-2-closure-design.md`, `docs/superpowers/plans/2026-05-13-phase-2-closure-plan-1-git-bootstrap.md` (A8)

---

## Task 0: Verify preconditions

**Files:**

- Read-only inspection.

- [ ] **Step 0.1: Verify git state has no commits**

Run:

```bash
cd /home/tiago/Documents/cruor
git log --oneline 2>&1 | head -3
```

Expected output: `fatal: your current branch 'main' does not have any commits yet`

If commits already exist, **STOP** and reconcile with the user.

- [ ] **Step 0.2: Verify current branch is `main`**

Run:

```bash
git branch --show-current
```

Expected: `main`

If different: `git branch -M main`.

- [ ] **Step 0.3: Verify no existing remote**

Run:

```bash
git remote -v
```

Expected: empty output. If a remote called `origin` already exists pointing elsewhere, **STOP** and ask the user.

- [ ] **Step 0.4: Verify `.gitignore` blocks `.env`, `dist`, `node_modules`, `routeTree.gen.ts`**

Run:

```bash
git check-ignore -v backend/.env frontend/.env ai-service/.env backend/dist frontend/dist backend/node_modules frontend/node_modules ai-service/node_modules frontend/src/routeTree.gen.ts 2>&1 | head -10
```

Expected: every path returns a `.gitignore` rule (each line of output starts with `.gitignore:<line>:<pattern>`).

If any expected ignore is missing, **STOP** and inspect `.gitignore`.

- [ ] **Step 0.5: Verify Supabase Postgres is reachable** (needed for Prisma validation steps)

Run:

```bash
supabase status 2>&1 | head -5
```

If Postgres is down, run `supabase start` and wait until ready.

- [ ] **Step 0.6: Inspect what husky pre-commit runs**

Run:

```bash
cat .husky/pre-commit 2>/dev/null
cat lint-staged.config.js
```

Expected: pre-commit invokes `lint-staged` only (formatter on staged files), NOT a full `pnpm typecheck`.

**If pre-commit runs typecheck:** the retroactive commits A3-A6 will fail because the staged `app.ts` (which imports Phase 1+2 modules) will not typecheck against a Phase-0-only staged set. In that case, **STOP** and discuss with the user. Options: (a) split `app.ts` into per-phase commits with manual edits to remove imports temporarily, or (b) temporarily disable the hook for retroactive commits (`HUSKY=0 git commit ...`) and accept that intermediate commits are file-system snapshots, not individually compilable. **Option (b) is acceptable for this plan** as long as Task 10.4-10.6 verify the **final** state passes.

- [ ] **Step 0.7: Make safety copy of full schema NOW**

```bash
cp backend/prisma/schema.prisma /tmp/schema-full.prisma.bak
wc -l /tmp/schema-full.prisma.bak
```

This backup is needed in Tasks 4, 6, 7. Doing it now (before any modification) protects against accidental loss.

---

## Note on retroactive commit compilability

A3, A4, A5 stage the working-tree versions of `backend/src/app.ts` and `frontend/src/main.tsx` (the **final** versions, which import all modules including Phase 1 and 2). At commit A3, the staged file system imports modules that aren't yet committed — these commits are **not individually compilable** in isolation.

This is a conscious trade-off:

- The history is **snapshot-honest**: each commit represents the set of files that logically belong to that phase, not what would individually compile.
- The **final state** (after A6) passes the full pipeline. Task 10.4-10.6 verify this.
- The user's spec § 6.2 explicitly chose the pruning approach for `schema.prisma`; doing the same for `app.ts` would require editing it 3 times (Phase 0 → Phase 1 routers → Phase 2 router added). The extra fragility outweighs the marginal benefit.

If a reviewer ever runs `git bisect` on Phase 0 commits and expects typecheck to pass, this is the place to point them.

---

## Task 1: First commit + remote + push

**Files:**

- Stage: `README.md`

- [ ] **Step 1.1: Stage README only**

Run:

```bash
git add README.md
git status
```

Expected staged: `README.md` (1 file). Nothing else.

- [ ] **Step 1.2: Create first commit**

Run:

```bash
git commit -m "first commit"
```

Expected: husky/commitlint runs and **may reject** `first commit` because it's not Conventional Commits.

If rejected, re-run with a conventional message:

```bash
git commit -m "chore: initial commit"
```

If commitlint is configured to allow `first commit` (some configs whitelist it), the original passes. Either is fine — keep what works.

- [ ] **Step 1.3: Add GitHub remote**

Run:

```bash
git remote add origin git@github.com:cruor-organization/cruor-crm.git
git remote -v
```

Expected: 2 lines showing `origin <url> (fetch)` and `origin <url> (push)`.

- [ ] **Step 1.4: Push first commit, set upstream**

Run:

```bash
git push -u origin main
```

Expected: push succeeds. If GitHub rejects because the repo already has commits (somehow), **STOP** and reconcile with the user — don't force-push.

- [ ] **Step 1.5: Verify remote sync**

Run:

```bash
git log --oneline origin/main 2>&1 | head -3
```

Expected: 1 commit visible on `origin/main`.

---

## Task 2: A1 — Master prompt + project instructions

**Files:**

- Stage: `prompt.md`, `CLAUDE.md`

- [ ] **Step 2.1: Stage the two docs**

Run:

```bash
git add prompt.md CLAUDE.md
git status
```

Expected staged: `prompt.md`, `CLAUDE.md` (2 files).

- [ ] **Step 2.2: Commit**

Run:

```bash
git commit -m "docs: master prompt v3 + project instructions"
```

Expected: commitlint passes (`docs:` is conventional).

- [ ] **Step 2.3: Push**

Run:

```bash
git push origin main
```

---

## Task 3: A2 — Repo tooling baseline

**Files:**

- Stage: root configs, `.husky/`, `.github/`, `docker/`, `supabase/config.toml`, `docs/architecture.md`, `docs/00-bootstrap.md`, `docs/decisions/0001-better-auth-com-supabase-postgres.md`, `docs/decisions/0002-layout-3-pastas-standalone.md`

- [ ] **Step 3.1: Stage tooling files**

Run:

```bash
git add \
  package.json pnpm-lock.yaml \
  .editorconfig .nvmrc .gitignore .env.example \
  commitlint.config.js lint-staged.config.js prettier.config.js \
  .husky .github docker supabase/config.toml \
  docs/architecture.md docs/00-bootstrap.md \
  docs/decisions/0001-better-auth-com-supabase-postgres.md \
  docs/decisions/0002-layout-3-pastas-standalone.md
git status
```

Expected staged: ~15-20 files under the paths above. Nothing under `backend/`, `frontend/`, `ai-service/`.

If `supabase/` shows untracked `.branches/` or other files, those must be gitignored already (Task 0 Step 0.4). If any non-`config.toml` file shows up staged, unstage with `git restore --staged <file>`.

- [ ] **Step 3.2: Commit**

Run:

```bash
git commit -m "chore: repo tooling baseline (pnpm, prettier, husky, commitlint, eslint configs)"
```

- [ ] **Step 3.3: Push**

```bash
git push origin main
```

---

## Task 4: A3 — Backend Phase 0 (with schema pruned)

This is the **most delicate task** in the plan. The `schema.prisma` in the working tree contains models from Phase 0, 1, AND 2. To make A3 honest ("backend at Phase 0 state"), we temporarily prune the schema to Phase 0 only, commit, then restore it in A5 and A6.

**Files:**

- Stage: `backend/package.json`, `backend/pnpm-lock.yaml`, `backend/tsconfig.json`, `backend/tsconfig.build.json`, `backend/vitest.config.ts`, `backend/eslint.config.js`, `backend/Dockerfile`, `backend/.env.example`
- Stage: `backend/prisma/schema.prisma` (pruned), `backend/prisma/migrations/migration_lock.toml`, `backend/prisma/migrations/20260510_init/`
- Stage: `backend/src/index.ts`, `backend/src/app.ts`, `backend/src/logger.ts`, `backend/src/config/`, `backend/src/auth/`, `backend/src/db/`, `backend/src/middlewares/`, `backend/src/routes/`, `backend/src/shared/`, `backend/src/types/`
- Stage: `backend/tests/health.test.ts`
- Do **NOT** stage: `backend/src/modules/`, `backend/src/domain/`, `backend/prisma/migrations/20260510_phase_1_domain/`, `backend/prisma/migrations/20260511_phase_2_stock_pricing/`

- [ ] **Step 4.1: Confirm backup exists (created in Step 0.7)**

Run:

```bash
ls -la /tmp/schema-full.prisma.bak
wc -l /tmp/schema-full.prisma.bak backend/prisma/schema.prisma
```

Expected: backup file exists, line counts match (full schema). If backup is missing (machine rebooted), re-create:

```bash
cp backend/prisma/schema.prisma /tmp/schema-full.prisma.bak
```

ONLY safe if `schema.prisma` has not been edited since the start of the plan.

- [ ] **Step 4.2: Identify Phase 1 + Phase 2 entities to remove**

From `prompt.md` and the schema, the models and enums introduced after Phase 0 are:

**Phase 1 models:** `Supplier`, `Customer`, `CustomerLead`, `CustomerActivity`, `Product`, `ProductVariant`, `ProductMedia`, `ProductVote`, `Bundle`, `AuditLog`

**Phase 1 enums:** `SupplierType`, `Incoterm`, `CustomerBusinessType`, `PricingTier`, `CustomerStatus`, `PreferredChannel`, `DayOfWeek`, `LeadStatus`, `LeadSource`, `ActivityKind`, `ProductCategory`, `MaterialPrimary`, `ProductFinish`, `VisualStyle`, `HumiditySensitivity`, `ProductDecision`, `ProductStatus`, `MediaKind`

**Phase 2 models:** `StockLocation`, `StockLevel`, `StockMovement`, `PriceList`, `PriceListLine`, `CustomerSpecialPrice`

**Phase 2 enums:** `StockMovementKind`, `StockMovementRefType`, `PriceListStatus`, `PriceListCurrency`

**Phase 0 keeps only:** `User`, `Session`, `Account`, `Verification`, `Organization`, `Member`, `Invitation` + any `datasource`/`generator`/`extensions` blocks (pgvector).

Open `backend/prisma/schema.prisma` in your editor and delete every block (`model X { ... }` and `enum Y { ... }`) listed above as Phase 1 or Phase 2. **Keep all Phase 0 entities, the `datasource db`, the `generator client`, and any `extensions = [vector]` config.**

- [ ] **Step 4.3: Verify pruned schema syntax**

Run:

```bash
cd backend && npx prisma format && cd ..
```

Expected: file is reformatted with no errors. If it fails to parse (e.g., a relation field references a removed model), open the schema and remove the dangling relation field from whatever Phase 0 model still references it. Re-run `prisma format` until clean.

- [ ] **Step 4.4: Validate pruned schema against Phase 0 migration**

Run:

```bash
cd backend
DATABASE_URL="postgresql://postgres:postgres@127.0.0.1:54322/postgres" npx prisma migrate diff \
  --from-migrations prisma/migrations \
  --to-schema-datamodel prisma/schema.prisma \
  --shadow-database-url "postgresql://postgres:postgres@127.0.0.1:54322/postgres" \
  2>&1 | head -50
cd ..
```

Expected: the migration set contains migrations beyond Phase 0 (because `migrations/` still has Phase 1 and Phase 2 dirs), so the diff will be large. **This step is informational**, not blocking.

The real test is: does `prisma format` work? Yes → proceed.

- [ ] **Step 4.5: Stage backend Phase 0 files**

Run:

```bash
git add \
  backend/package.json backend/pnpm-lock.yaml \
  backend/tsconfig.json backend/tsconfig.build.json \
  backend/vitest.config.ts backend/eslint.config.js \
  backend/Dockerfile backend/.env.example \
  backend/prisma/schema.prisma \
  backend/prisma/migrations/migration_lock.toml \
  backend/prisma/migrations/20260510_init \
  backend/src/index.ts backend/src/app.ts backend/src/logger.ts \
  backend/src/config backend/src/auth backend/src/db \
  backend/src/middlewares backend/src/routes \
  backend/src/shared backend/src/types \
  backend/tests/health.test.ts
git status
```

- [ ] **Step 4.6: Verify nothing from modules/domain/Phase-1+2 migrations is staged**

Run:

```bash
git diff --cached --name-only | grep -E "modules/|domain/|20260510_phase_1|20260511_phase_2" || echo "clean"
```

Expected output: `clean`.

If anything appears, unstage it: `git restore --staged backend/src/modules backend/src/domain backend/prisma/migrations/20260510_phase_1_domain backend/prisma/migrations/20260511_phase_2_stock_pricing`.

Also verify there's nothing under `backend/src/` that shouldn't be there:

```bash
git diff --cached --name-only | grep "^backend/src/" | sort
```

Expected: only files inside `index.ts`, `app.ts`, `logger.ts`, `config/`, `auth/`, `db/`, `middlewares/`, `routes/`, `shared/`, `types/`. **No `modules/`, no `domain/`.**

- [ ] **Step 4.7: Commit**

Run:

```bash
git commit -m "feat(backend): phase 0 — better-auth + prisma init + express skeleton"
```

If husky's pre-commit hook runs lint and fails because the staged schema has dangling references the linter cares about, fix and retry. The pruned schema must still pass `prisma format` and be self-consistent.

- [ ] **Step 4.8: Push**

```bash
git push origin main
```

- [ ] **Step 4.9: Verify schema.prisma is the pruned version on disk**

Run:

```bash
grep -c "^model " backend/prisma/schema.prisma
```

Expected: exactly **7** (User, Session, Account, Verification, Organization, Member, Invitation).

---

## Task 5: A4 — Frontend Phase 0

**Files:**

- Stage: `frontend/package.json`, `frontend/pnpm-lock.yaml`, `frontend/tsconfig.json`, `frontend/tsconfig.build.json`, `frontend/vite.config.ts`, `frontend/tsr.config.json`, `frontend/tailwind.config.ts`, `frontend/postcss.config.js`, `frontend/eslint.config.js`, `frontend/Dockerfile`, `frontend/index.html`, `frontend/.env.example`, `frontend/docker/nginx.conf`
- Stage: `frontend/src/main.tsx`, `frontend/src/vite-env.d.ts`, `frontend/src/lib/`, `frontend/src/routes/`

- [ ] **Step 5.1: Stage frontend files**

Run:

```bash
git add \
  frontend/package.json frontend/pnpm-lock.yaml \
  frontend/tsconfig.json frontend/tsconfig.build.json \
  frontend/vite.config.ts frontend/tsr.config.json \
  frontend/tailwind.config.ts frontend/postcss.config.js \
  frontend/eslint.config.js frontend/Dockerfile \
  frontend/index.html frontend/.env.example \
  frontend/docker/nginx.conf \
  frontend/src/main.tsx frontend/src/vite-env.d.ts \
  frontend/src/lib frontend/src/routes
git status
```

- [ ] **Step 5.2: Verify routeTree.gen.ts is NOT staged**

Run:

```bash
git diff --cached --name-only | grep routeTree && echo "BAD" || echo "ok"
```

Expected: `ok`. The generated file must stay gitignored.

- [ ] **Step 5.3: Verify .env is NOT staged**

```bash
git diff --cached --name-only | grep "frontend/.env$" && echo "BAD" || echo "ok"
```

Expected: `ok`.

- [ ] **Step 5.4: Commit**

```bash
git commit -m "feat(frontend): phase 0 — vite + tanstack router + auth client + listings shells"
```

- [ ] **Step 5.5: Push**

```bash
git push origin main
```

---

## Task 6: A5 — Phase 1 (schema restored to Phase 1 state + modules)

This task restores `schema.prisma` so it contains Phase 0 + Phase 1 entities (but **not** Phase 2). It also stages the Phase 1 modules and domain code.

**Files:**

- Modify: `backend/prisma/schema.prisma` (extend with Phase 1 entities)
- Stage: `backend/prisma/schema.prisma`, `backend/prisma/migrations/20260510_phase_1_domain/`
- Stage: `backend/src/modules/suppliers/`, `backend/src/modules/customers/`, `backend/src/modules/leads/`, `backend/src/modules/products/`, `backend/src/modules/audit/`
- Stage: `backend/src/domain/suppliers/`, `backend/src/domain/customers/`, `backend/src/domain/index.ts`
- Stage: `backend/src/app.ts` (modified to mount the 4 new routers — already in working tree)
- Do **NOT** stage: `backend/src/modules/stock/`, `backend/src/domain/stock/`, `backend/src/domain/pricing/`, `backend/prisma/migrations/20260511_phase_2_stock_pricing/`

- [ ] **Step 6.1: Restore schema to Phase 1 state**

Open `/tmp/schema-full.prisma.bak` (full schema) and copy it into `backend/prisma/schema.prisma`, **but then prune the Phase 2 entities** (the inverse of Task 4 Step 4.2):

Run:

```bash
cp /tmp/schema-full.prisma.bak backend/prisma/schema.prisma
```

Now open `backend/prisma/schema.prisma` and delete every block matching Phase 2:

**Phase 2 models to remove:** `StockLocation`, `StockLevel`, `StockMovement`, `PriceList`, `PriceListLine`, `CustomerSpecialPrice`

**Phase 2 enums to remove:** `StockMovementKind`, `StockMovementRefType`, `PriceListStatus`, `PriceListCurrency`

If any Phase 1 model has a relation field pointing to a removed Phase 2 model (e.g., `Customer` may have `specialPrices CustomerSpecialPrice[]`), remove that relation field too.

- [ ] **Step 6.2: Validate Phase 1 schema syntax**

```bash
cd backend && npx prisma format && cd ..
```

Expected: clean format, no errors.

- [ ] **Step 6.3: Verify schema model count is correct**

```bash
grep -c "^model " backend/prisma/schema.prisma
```

Expected: **17** (7 Phase 0 + 10 Phase 1 models: Supplier, Customer, CustomerLead, CustomerActivity, Product, ProductVariant, ProductMedia, ProductVote, Bundle, AuditLog).

- [ ] **Step 6.4: Confirm app.ts in working tree already mounts the Phase 1 routers**

Inspect:

```bash
grep -nE "use\('/api/(suppliers|customers|leads|products)'" backend/src/app.ts
```

Expected: 4 matches. If yes, `app.ts` will be staged as part of this commit because it differs from the Phase 0 version committed in A3.

- [ ] **Step 6.5: Stage Phase 1 files**

```bash
git add \
  backend/prisma/schema.prisma \
  backend/prisma/migrations/20260510_phase_1_domain \
  backend/src/modules/suppliers backend/src/modules/customers \
  backend/src/modules/leads backend/src/modules/products \
  backend/src/modules/audit \
  backend/src/domain/suppliers backend/src/domain/customers \
  backend/src/domain/index.ts \
  backend/src/app.ts
git status
```

- [ ] **Step 6.6: Verify Phase 2 module/domain/migration is NOT staged**

```bash
git diff --cached --name-only | grep -E "modules/stock|domain/stock|domain/pricing|20260511_phase_2" && echo "BAD" || echo "ok"
```

Expected: `ok`.

- [ ] **Step 6.7: Commit**

```bash
git commit -m "feat: phase 1 — schema + RBAC + 4 modulos backend"
```

- [ ] **Step 6.8: Push**

```bash
git push origin main
```

---

## Task 7: A6 — Phase 2 baseline (schema final + stock module + pricing domain)

This task restores the schema to its final state and stages the Phase 2 baseline code.

**Files:**

- Modify: `backend/prisma/schema.prisma` (restore from `/tmp/schema-full.prisma.bak`)
- Stage: `backend/prisma/schema.prisma`, `backend/prisma/migrations/20260511_phase_2_stock_pricing/`
- Stage: `backend/src/modules/stock/`, `backend/src/domain/stock/`, `backend/src/domain/pricing/`
- Stage: `backend/src/app.ts` (modified to mount `/api/stock` — already in working tree)

- [ ] **Step 7.1: Restore full schema**

```bash
cp /tmp/schema-full.prisma.bak backend/prisma/schema.prisma
cd backend && npx prisma format && cd ..
```

Expected: clean.

- [ ] **Step 7.2: Verify schema model count is full**

```bash
grep -c "^model " backend/prisma/schema.prisma
```

Expected: **23** (17 Phase 1 + 6 Phase 2 models: StockLocation, StockLevel, StockMovement, PriceList, PriceListLine, CustomerSpecialPrice).

- [ ] **Step 7.3: Verify migrations directory is complete**

```bash
ls backend/prisma/migrations/
```

Expected: `20260510_init`, `20260510_phase_1_domain`, `20260511_phase_2_stock_pricing`, `migration_lock.toml`.

- [ ] **Step 7.4: Apply migrations to local DB to confirm consistency**

```bash
cd backend
DATABASE_URL="postgresql://postgres:postgres@127.0.0.1:54322/postgres" npx prisma migrate status
cd ..
```

Expected: "Database schema is up to date" (the migrations should already have been deployed during prior dev work; if not, run `prisma migrate deploy`).

- [ ] **Step 7.5: Confirm app.ts in working tree mounts `/api/stock`**

```bash
grep -n "use\('/api/stock'" backend/src/app.ts
```

Expected: 1 match.

- [ ] **Step 7.6: Stage Phase 2 baseline files**

```bash
git add \
  backend/prisma/schema.prisma \
  backend/prisma/migrations/20260511_phase_2_stock_pricing \
  backend/src/modules/stock \
  backend/src/domain/stock backend/src/domain/pricing \
  backend/src/app.ts
git status
```

- [ ] **Step 7.7: Verify nothing unexpected staged**

```bash
git diff --cached --name-only
```

Expected: only files under the paths in Step 7.6. No frontend, no ai-service, no docs.

- [ ] **Step 7.8: Commit**

```bash
git commit -m "feat: phase 2 baseline — schema + stock module + pricing domain"
```

- [ ] **Step 7.9: Push**

```bash
git push origin main
```

- [ ] **Step 7.10: Remove the schema backup**

```bash
rm /tmp/schema-full.prisma.bak
```

---

## Task 8: A7 — Handoff + phase 1 retrospective + ai-service stub

**Files:**

- Stage: `docs/HANDOFF.md`, `docs/01-phase-1.md`
- Stage: `ai-service/**` (everything: package.json, src, configs, Dockerfile)

**Note on README:** The current `README.md` in the working tree already reflects Phase 0 + Phase 1 status. It was committed in Task 1 (initial commit) as the only file. A7 does **not** re-touch README — README is updated in Plan 4 (docs closure) once Phase 2 is actually done.

- [ ] **Step 8.1: Stage docs and ai-service**

```bash
git add \
  docs/HANDOFF.md docs/01-phase-1.md \
  ai-service
git status
```

- [ ] **Step 8.2: Verify ai-service .env is NOT staged**

```bash
git diff --cached --name-only | grep "ai-service/.env$" && echo "BAD" || echo "ok"
```

Expected: `ok`.

- [ ] **Step 8.3: Verify ai-service dist/ is NOT staged**

```bash
git diff --cached --name-only | grep "ai-service/dist" && echo "BAD" || echo "ok"
```

Expected: `ok`.

- [ ] **Step 8.4: Commit**

```bash
git commit -m "docs: handoff + phase 1 retrospective + ai-service stub"
```

- [ ] **Step 8.5: Push**

```bash
git push origin main
```

---

## Task 9: A8 — Phase 2 closure design spec + this implementation plan

**Files:**

- Stage: `docs/superpowers/specs/2026-05-13-phase-2-closure-design.md`
- Stage: `docs/superpowers/plans/2026-05-13-phase-2-closure-plan-1-git-bootstrap.md`

- [ ] **Step 9.1: Stage spec and plan**

```bash
git add docs/superpowers
git status
```

Expected: 2 files staged under `docs/superpowers/`.

- [ ] **Step 9.2: Commit**

```bash
git commit -m "docs(spec): phase 2 closure design + plan 1 (git bootstrap)"
```

- [ ] **Step 9.3: Push**

```bash
git push origin main
```

---

## Task 10: Final verification

- [ ] **Step 10.1: Confirm 9 commits in main**

```bash
git log --oneline | head -15
```

Expected (in reverse chronological order):

```
<hash> docs(spec): phase 2 closure design + plan 1 (git bootstrap)
<hash> docs: handoff + phase 1 retrospective + ai-service stub
<hash> feat: phase 2 baseline — schema + stock module + pricing domain
<hash> feat: phase 1 — schema + RBAC + 4 modulos backend
<hash> feat(frontend): phase 0 — vite + tanstack router + auth client + listings shells
<hash> feat(backend): phase 0 — better-auth + prisma init + express skeleton
<hash> chore: repo tooling baseline (pnpm, prettier, husky, commitlint, eslint configs)
<hash> docs: master prompt v3 + project instructions
<hash> chore: initial commit  (or "first commit" if commitlint accepted)
```

If counts or order are off, **STOP** and reconcile with the user.

- [ ] **Step 10.2: Confirm local matches remote**

```bash
git fetch origin
git rev-parse HEAD origin/main
```

Expected: both hashes identical.

- [ ] **Step 10.3: Confirm working tree is clean**

```bash
git status
```

Expected: `nothing to commit, working tree clean`.

If anything is dirty (e.g., the schema backup wasn't removed in Step 7.10, or stray `.history/` files), reconcile:

- `rm /tmp/schema-full.prisma.bak` (should already be removed in 7.10)
- `.history/` is gitignored, should not appear
- If unexpected files appear, decide with the user whether they go in plan 2/3/4 or get committed as a small `chore:` fix.

- [ ] **Step 10.4: Verify backend pipeline still passes against the committed state**

```bash
cd backend
pnpm typecheck
pnpm lint
pnpm test
cd ..
```

Expected: all three pass. If `typecheck` or `test` fail because `schema.prisma` had a regression during the prune/restore dance, **STOP** — the working tree no longer matches what was tested before plan execution. Investigate with `git diff HEAD~9 -- backend/prisma/schema.prisma` to see the net change vs. the pre-plan state.

- [ ] **Step 10.5: Verify frontend pipeline**

```bash
cd frontend
pnpm typecheck
pnpm lint
pnpm build
cd ..
```

Expected: all three pass.

- [ ] **Step 10.6: Verify ai-service pipeline**

```bash
cd ai-service
pnpm typecheck
pnpm lint
pnpm build
cd ..
```

Expected: all three pass.

- [ ] **Step 10.7: Mark plan complete**

The git history is now bootstrapped. The user can begin Plan 2 (Backend Phase 2 closure) with confidence that all existing work is safely on the remote.

---

## Risks & rollback

- **Schema prune introduces dangling relation fields.** Mitigation: Step 4.3 runs `prisma format` which catches most issues. If a Phase 0 model references a removed Phase 1 entity (e.g., `Member` referencing `Customer`), remove the relation field from the Phase 0 model in Step 4.2.
- **Commitlint rejects "first commit" message.** Mitigation: Step 1.2 falls back to `chore: initial commit`.
- **Push fails on `git push -u origin main`** (Step 1.4) because the GitHub repo was already initialized with a different commit on `main` (e.g., GitHub auto-created a README). Mitigation: do **NOT** force-push. Instead pull with `--allow-unrelated-histories`, resolve the merge, and try again. If the merge is non-trivial, ask the user.
- **Husky pre-commit hook fails** mid-task (e.g., lint-staged tries to format a partially-staged schema). Mitigation: each commit can be retried. Never use `--no-verify` to skip the hook.
- **`/tmp/schema-full.prisma.bak` is deleted before Task 7.** Mitigation: if lost, regenerate by checking out the schema from the most recent commit on `main` once the schema was final — but that's circular. Best: do **not** reboot the machine mid-plan. If lost, manually copy `backend/prisma/schema.prisma` to `/tmp/schema-full.prisma.bak` BEFORE Task 4.1 (an extra precaution: copy at the start of the plan, not in Task 4).
