# Theme Toggle (claro / escuro) — Design Spec

**Data:** 2026-05-14
**Estado:** Spec **prospetiva** — a feature ainda não está implementada.
Aprovada em brainstorming; próximo passo é o plano de implementação.
**Próximo passo:** Plano de implementação (`writing-plans`) → execução.

---

## 1. Contexto

O frontend (`frontend/`, React 18 + TanStack Router + Tailwind 3) tem hoje
**dois mundos visuais**:

- **As CRMs** (dentro do `AppShell`) — superfícies **claras**. Já correm sobre
  um sistema de CSS vars injetadas no `<html>` por `applyCrmTheme()`
  (`src/lib/crm/theme.ts`): `--cruor-*` (acento) e `--neutral-*` (estrutura).
  Há 4 presets de CRM (Flora/Forge/Pulse/Studio), cada um com a sua rampa — mas
  **ambas as rampas são claras**.
- **O hub (`/`) e os ecrãs de auth** (`sign-in`, `sign-up`, `AuthLayout`,
  `EcosystemHub`) — superfícies **escuras**, com o escuro _hardcoded_
  (`bg-[#0A0A0C]`, `text-white`, `border-white/10`) e o acento da marca-mãe
  `#E23D51`. Correm fora do `AppShell` (rotas standalone).

As cores semânticas (`green/amber/blue/red/ink`) e as sombras (`--shadow-*`)
estão em **hex fixo** no `tailwind.config.ts` — não são var-driven.

O `globals.css` já antecipa isto: _"Tokens semânticos — sombras/raios. Permitem
um futuro dark mode trivial."_

## 2. Objetivo

Introduzir um **tema global claro/escuro** controlado pelo utilizador, ortogonal
ao sistema de acento por-CRM que já existe. O utilizador escolhe; a escolha
persiste; aplica-se a **toda** a app (CRMs, hub e auth).

Decisões fechadas em brainstorming:

1. **Tema global único** — o toggle controla tudo. Exige variante **clara** do
   hub/auth **e** variante **escura** das CRMs.
2. **Toggle na topbar das CRMs + canto do hub/auth** — sempre visível.
3. **Rampa escura partilhada** — um único conjunto de neutros escuros para as 4
   CRMs; só o acento (`--cruor-*`) varia por CRM.

## 3. Princípio central: inverter a rampa `--neutral-*`

O código usa a rampa `neutral` por convenção: **índices baixos = superfície,
índices altos = texto** (`bg-neutral-100` para canvas, `text-neutral-900` para
texto). Se em modo escuro o `--neutral-50` passar a ser um valor _escuro_ e o
`--neutral-950` um valor _claro_, todos esses usos invertem-se sozinhos —
**sem `dark:` classes espalhadas pelos componentes**.

A rampa escura é **hand-tuned**, não uma inversão matemática: superfícies
escuras precisam de ligeira dessaturação e o "texto" mais claro não é branco
puro.

## 4. Arquitetura

### 4.1 Tokenizar as escalas restantes

`green`, `amber`, `blue`, `red`, `ink` passam de hex fixo no
`tailwind.config.ts` para CSS vars, definidas no `globals.css`. **Os nomes de
classe não mudam** (`bg-green-50` continua `bg-green-50`) → zero sweep nos
componentes; muda só `tailwind.config.ts` + `globals.css`.

### 4.2 `ThemeProvider` + `theme.ts`

Espelho do par `CrmProvider` / `crm/theme.ts` que já existe:

- `src/lib/theme/theme.ts` — `THEME_STORAGE_KEY = 'cruor:theme'`,
  `readStoredTheme()` (lê localStorage; na primeira visita semeia a partir de
  `prefers-color-scheme`), `applyTheme(theme)` (escreve `data-theme` no
  `<html>`), `initTheme()` (corre pré-paint no `main.tsx`, sem flash).
- `src/lib/theme/ThemeProvider.tsx` — contexto com `{ theme, toggleTheme,
setTheme }`. `useTheme()` hook.

### 4.3 `applyCrmTheme` passa a theme-aware

`applyCrmTheme()` escreve CSS vars **inline** no `<html>`, e inline ganha a
regras de stylesheet. Logo o `--neutral-*` escuro **tem de** vir do
`applyCrmTheme`, não de uma regra `[data-theme="dark"]` no CSS.

- `applyCrmTheme(preset, theme)`:
  - escreve **sempre** `--cruor-*` a partir do `preset`;
  - escreve `--neutral-*` do `preset` em modo claro;
  - escreve `--neutral-*` da constante partilhada `DARK_NEUTRALS` em modo
    escuro.
- As cores semânticas (`green/amber/blue/red/ink`) e as sombras **não** são
  por-CRM → ficam em CSS puro: `:root { … }` vs `:root[data-theme="dark"] { … }`
  no `globals.css`. Sem inline, a regra CSS ganha sem conflito.
- `color-scheme` alterna `light`/`dark` no bloco `[data-theme="dark"]` para os
  controlos nativos e scrollbars adaptarem.

### 4.4 Coordenação Theme ↔ CRM

Ordem no `main.tsx`: `<ThemeProvider>` por fora de `<CrmProvider>`.
`CrmProvider` consome `useTheme()`; reaplica `applyCrmTheme(preset, theme)`
quando **qualquer** dos dois muda (no `setCrm` e num `useEffect` que observa
`theme`). `applyCrmTheme` mantém-se uma função pura.

### 4.5 Sweep do `bg-white`

37 ficheiros usam `bg-white`. Todos os usos são **superfícies elevadas** (cards,
sidebar, header, inputs, botão `secondary`) — nenhum é branco literal.
Sweep `bg-white` → `bg-neutral-50` (o token de superfície elevada: quase-branco
em claro, escuro-elevado em escuro). Idem `ring-white` e `focus-within:bg-white`
→ variantes `neutral-50`.

## 5. Hub & Auth — variante clara

`EcosystemHub` e `AuthLayout` (e por arrasto `sign-in`/`sign-up`) reescrevem-se
sobre os tokens, para renderizar **claro ou escuro**:

- `bg-[#0A0A0C]` → token de canvas; `text-white` → `text-neutral-900`;
  `border-white/10` → `border-neutral-200`; etc.
- O acento `#E23D51` (marca-mãe Cruor) **mantém-se** — não é um acento de CRM,
  é constante da identidade do hub/auth.
- As 3 camadas de atmosfera (halo do acento + grelha pontilhada + grão) ganham
  valores de opacidade por tema (ex.: o grão e a grelha pesam mais em escuro,
  menos em claro).

## 6. Toggle

`src/components/ui/ThemeToggle.tsx` — botão com ícones `Sun`/`Moon`
(`lucide-react`) e transição. Reutilizável, lê `useTheme()`.

- **CRMs:** na topbar do `AppShell`, ao lado do sino de notificações.
- **Hub/Auth:** num canto discreto (alinhado com a chrome existente — ex.: no
  cabeçalho do hub junto ao botão de sair; no `AuthLayout` num canto superior).

## 7. Persistência e estados

- Chave localStorage: `cruor:theme`, valores `'light'` | `'dark'`.
- Primeira visita (chave ausente): semeia de `prefers-color-scheme`, escreve a
  chave.
- Valor inválido na chave: cai para `'light'` e reescreve (mesmo padrão do
  `readStoredCrmId`).
- `initTheme()` corre antes do React no `main.tsx`, a par do `initCrmTheme()`.

## 8. Fora de âmbito

- Não há tema por-CRM ou por-superfície (fechado: tema global único).
- Não há rampa escura por-CRM (fechado: rampa partilhada).
- Não se toca no conteúdo/estrutura do hub e auth além do necessário para
  tokenizar superfície e atmosfera.

## 9. Ficheiros afetados

**Novos:**

- `src/lib/theme/theme.ts`
- `src/lib/theme/ThemeProvider.tsx`
- `src/components/ui/ThemeToggle.tsx`

**Modificados:**

- `tailwind.config.ts` — `green/amber/blue/red/ink` → CSS vars.
- `src/styles/globals.css` — vars semânticas em `:root`; bloco
  `:root[data-theme="dark"]` (semânticas dark + sombras dark + `color-scheme`).
- `src/lib/crm/theme.ts` — `applyCrmTheme` theme-aware + `DARK_NEUTRALS`.
- `src/lib/crm/CrmProvider.tsx` — consome `useTheme()`, reaplica em mudança.
- `src/main.tsx` — `<ThemeProvider>` + `initTheme()`.
- `src/routes/__root.tsx` — `<ThemeToggle>` na topbar; sweep `bg-white`.
- `src/components/hub/EcosystemHub.tsx` — variante clara + `<ThemeToggle>`.
- `src/components/auth/auth-layout.tsx` — variante clara + `<ThemeToggle>`.
- `src/routes/sign-in.tsx`, `src/routes/sign-up.tsx` — tokens.
- ~37 ficheiros — sweep `bg-white` → `bg-neutral-50`.

## 10. Verificação

- `pnpm typecheck` e `pnpm lint` limpos.
- Inspeção visual: cada uma das 4 CRMs em claro **e** escuro; hub e auth em
  claro **e** escuro; toggle persiste após reload; sem flash de tema no arranque.
