# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repository is

A **specification-only** repository for an internal CRM targeting a Portuguese/Iberian B2B wholesaler of dried/preserved flowers and florist supplies. There is no code yet — only `prompt.md`, a 1614-line "Master Prompt v3" that is the authoritative design contract.

A future Claude session is expected to generate the codebase from this prompt, phase by phase. **Phase 0 (bootstrap) has not run yet** — there is no `package.json`, no monorepo, no commands. Do not fabricate `pnpm` commands until the corresponding files exist.

`.history/` is editor-local snapshot noise. Ignore it.

## Source of truth

`prompt.md` is the contract. Re-read the relevant section before producing artefacts — do not work from memory or invent design:

- §0 — locked parameters (stack, locale, currency, VAT, defaults). Treat these as fixed; ask before deviating.
- §4 — monorepo layout (`apps/{backend,frontend,ai-service}`, `packages/{db,shared,auth,domain,config}`).
- §5 — canonical stack. Do not substitute libraries (e.g. don't swap Better Auth → NextAuth, BullMQ → Bee, Resend → SendGrid).
- §7 — data model. Entity names, FSMs, and field semantics are prescriptive.
- §10.1–10.21 — module specs with few-shots. Each module has at least one worked example; mirror its shape.
- §15 — phase order. The build is gated; do not jump phases.
- §16 — output contract (see below).
- Anexos A, B — seasonal calendar and domain vocabulary.

## Output contract (§16)

Every substantive response must be structured:

```
<thinking>
  CoT per §3 (and the conditional §3.1 — see below)
</thinking>

## Plano
3–7 bullets.

## Artefactos
Code / schemas / docs with full file paths in comments.

## Self-critique
Three honest questions + answers (§16.1). "Nothing to point out" is invalid.

## Próximos passos
Pending items, confirmations needed.
```

**CoT conditionals (§3.1)** — extend the `<thinking>` block when:

- LLM / scraping / untrusted input is involved → add **AMEAÇAS** (prompt injection, SSRF, exfiltration).
- Schema change → add **IMPACTO MIGRATION** (breaking? backfill? lock?).
- Pricing / stock / orders touched → add **INVARIANTES DE NEGÓCIO** (the rule it must preserve).

## Hard invariants (do not break)

These appear across multiple sections of `prompt.md` and are non-negotiable:

- **Multi-tenant**: `organizationId` on every domain table and in every query.
- **Stock ≥ 0**: enforce with a CHECK constraint. Reservations use `SELECT … FOR UPDATE` (§10.13).
- **Stock incremented at most once per Alibaba order**: gate on status transition `* → DELIVERED` (§10.12).
- **Order line prices are snapshots**: changing a `PriceList` never alters historical orders. `CustomerOrderLine` stores `unitPriceEur`, `discountPct`, `vatPct` (§7.5, §10.14).
- **Price floor = landed cost × 1.10**: violating throws `ValidationError("PRICE_BELOW_FLOOR")` (§10.4 few-shot 2).
- **Order FSM is strict**: invalid transitions throw `ValidationError("INVALID_ORDER_TRANSITION")`; all transitions logged in `OrderStatusHistory` (§7.4, §10.14 few-shot 3).
- **LLM tools are read-only by default**: mutating tools (`draftQuoteForCustomer`, etc.) emit a DRAFT; UI requires explicit confirmation (§10.8).
- **No `any`**: use `unknown` + narrowing. Zod `.strict()` at every entrypoint. Zero `$queryRawUnsafe` (§2, §9).
- **Webhooks**: verify signature + idempotent by `eventId` (Resend/Svix, Evolution HMAC, n8n HMAC, Fathom HMAC).
- **PII masking in logs**: email, NIF, phone, address (§9, Pino `redact`).

## Domain vocabulary (Anexo B)

Names matter. UI uses Portuguese florist terms; code uses English identifiers.

| Concept      | UI (pt-PT)                 | Code                        |
| ------------ | -------------------------- | --------------------------- |
| End customer | "florista"                 | `Customer`                  |
| Lead         | "florista potencial"       | `CustomerLead`              |
| Retail price | "PVP"                      | `recommendedRetailEur`      |
| Master pack  | "caixa / embalagem mestre" | `caseSize`                  |
| Shelf life   | "vida útil"                | `shelfLifeMonths`           |
| Batch        | "lote"                     | `batch` / `batchOriginDate` |
| Anchor SKU   | "peça âncora"              | (badge in product table)    |

Do **not** call a `Customer` a "B2B client" in UI copy. WhatsApp is the **primary** channel for this segment, not email (§0 `whatsapp_primary_channel: true`).

## Conventions

- Files: `kebab-case`. Types: `PascalCase`. Variables: `camelCase`.
- Architecture per module: `routes → controller → service → repository`. Pure business logic lives in `packages/domain` with no framework imports (§4, §6).
- DI by composition; no DI containers (§2 rule 7).
- Conventional Commits.
- Docs/comments default language: **pt-PT**. Code identifiers: English (§0).
- Errors: extend `AppError`. Subclasses surfaced in few-shots: `ValidationError`, `NotFoundError`, `ConflictError`, `ForbiddenError`, `IntegrationError`.

## Phase gate (§15)

`phase_gate: true` — at the end of every phase, **stop and wait for explicit confirmation** before starting the next. Phase order is fixed:

0. Bootstrap → 1. Núcleo Comercial → 2. Stock & Pricing → 3. Encomendas → 4. Conteúdo & IA → 5. Catálogos & Campanhas → 6. Automação & Crescimento → 7. Operação em Campo → 8. Hardening.

When the user asks to start work, default to the **next unstarted phase** (currently Phase 0). Do not generate Phase 4 RAG code while Phase 0 scaffolding is absent.

## Commands

None yet. After Phase 0 lands, expected commands (per §5, §14) will be:

- `pnpm install`
- `pnpm dev` (Turborepo orchestrates all apps)
- `pnpm lint` / `pnpm typecheck` / `pnpm test`
- `pnpm test --filter=<package>` for a single package
- `pnpm build`

Verify these against the actual `package.json` / `turbo.json` once they exist before quoting them to the user.

## Communication rules (§17, §1.3)

- Tone: PT-pt, direct, second person, no empty transitional phrases, no emojis in code or technical docs.
- Before generating code, list assumptions and ask if any should be revised.
- For non-trivial trade-offs, present 2 options with pros/cons + a recommendation.
- Don't invent libraries. If uncertain about API surface, consult docs (e.g. via `context7`) before coding.
- Honest TODOs: `// TODO(scope): <reason>`.
- "Não sei" is an acceptable answer — propose how to find out.
