# Ecosystem Hub — Design Spec

**Data:** 2026-05-14
**Estado:** Spec **retroativa** — a feature já está implementada no working tree e
passa `typecheck` + `lint`. Esta spec documenta as decisões de design tomadas
durante a implementação, para revisão antes do commit.
**Próximo passo:** Revisão do utilizador → commit da feature.

---

## 1. Contexto

O frontend (`frontend/`, React 18 + TanStack Router + Tailwind 3) tinha, até
agora, o `/` a renderizar o **Dashboard** do CRM Florista, dentro do `AppShell`
(sidebar + header). Depois da sessão do multi-CRM switcher
(`2026-05-14-multi-crm-switcher-design.md`), o `/` continuava a ser "uma página
do CRM".

A empresa-mãe **Cruor** não é só o CRM — é um ecossistema de apps (CRM hoje;
Faturação e Automações planeadas). Faltava um **ponto de entrada acima de
qualquer app**: a primeira superfície pós-login, de onde se escolhe para onde
ir.

## 2. Objetivo

Introduzir o **Hub do Ecossistema** como rota raiz (`/`): a superfície pós-login
que apresenta as apps da Cruor. Hoje só o CRM é navegável; o resto é contexto
ambiente. Em paralelo, alinhar os ecrãs de autenticação à mesma identidade
visual (superfície escura, atmosférica, acento da marca-mãe), para que o
percurso _sign-in → hub_ seja visualmente contínuo.

## 3. Scope

### Dentro

1. **Rota `/` = Hub** — `EcosystemHub`, um bento-grid escuro. Cartão "CRM" é o
   único navegável (→ `/dashboard`); os restantes 5 são cartões _ambiente_
   (não-navegáveis, dados mock).
2. **Dashboard movido para `/dashboard`** — o conteúdo antigo do `/` (KPIs,
   alertas, atividade, visitas) passa para `routes/dashboard.tsx`, sem
   alterações de conteúdo. O guard de auth (`beforeLoad`) acompanha.
3. **Conceito de rota "standalone"** no `__root.tsx` — `/` e `/sign-*` correm
   **fora do `AppShell`**: são superfícies de ecossistema, sem a chrome de um
   CRM específico.
4. **Link "Hub" no header do `AppShell`** — saída explícita de qualquer página
   do CRM de volta ao `/`.
5. **`AuthLayout`** — moldura escura partilhada para `sign-in` / `sign-up`,
   alinhada com o hub (mesmo preto, acento, atmosfera, tipografia mono).
   Sign-in e sign-up reescritos sobre ela.
6. **`lib/mock-data/hub.ts`** — dados mock do hub (apps do ecossistema, espaços
   do CRM, stats de receita/equipa/uptime).
7. **`framer-motion`** adicionado como dependência — entradas com stagger,
   loops de ambiente (flutuação, equalizador, pulsos), `useReducedMotion`
   respeitado em todos.

### Fora

| Item                                         | Razão                                                                | Quando            |
| -------------------------------------------- | -------------------------------------------------------------------- | ----------------- |
| Apps reais Faturação / Automações            | Não existem — cartões "Em breve" são placeholders                    | Fases futuras     |
| Navegação para os cartões ambiente           | Por design: só o CRM é navegável; o resto é contexto                 | Quando houver app |
| Dados reais no hub (receita, equipa, uptime) | Sem backend de ecossistema; tudo mock                                | Eventual          |
| Multi-tenancy / `organizationId`             | Continua fora do âmbito do shell — como na spec do switcher          | Eventual          |
| Rota de recuperação de password              | `TODO(auth)` no sign-in; fora do âmbito desta feature                | Fase 1            |
| Modo claro para o hub / auth                 | São superfícies de ecossistema — escuras por design, não tematizadas | —                 |

### Dívida assumida

- **Atmosfera duplicada** — as 3 camadas de ambiente (halo do acento + grelha
  pontilhada + grão SVG) e a constante `ACCENT = '#E23D51'` estão copiadas
  entre `EcosystemHub.tsx` e `auth-layout.tsx`. Aceitável a 2 sítios; se um
  terceiro surgir, extrair para `components/ecosystem/`.
- **`crmSpaces` redundante** — `lib/mock-data/hub.ts` repete `chip`/`name`/
  `swatch` dos 4 CRMs, que já vivem em `lib/crm/presets.ts`. Mantido separado
  para o cartão herói não depender da forma completa do `CrmPreset`; revisitar
  se as duas listas divergirem.
- **PNGs de iteração** na raiz do repo (`cruor-dashboard.png`, `btn-check.png`,
  etc. — 8 ficheiros) são scratch da sessão visual. **Não entram no commit** —
  apagar ou adicionar ao `.gitignore` da raiz.

## 4. Arquitetura

### 4.1 Hierarquia de superfícies

```
/                 → EcosystemHub      standalone, escuro       (acima das apps)
/sign-in /sign-up → AuthLayout        standalone, escuro       (pré-sessão)
/dashboard, /customers, /m/$slug, …  → AppShell  claro, tematizado por CRM
```

O `__root.tsx` decide por `pathname`:

```ts
const isStandalone = path.startsWith('/sign-') || path === '/';
if (isStandalone) return <Outlet />;   // sem sidebar/header
return <AppShell />;                    // chrome do CRM
```

O **acento escuro** (`#E23D51`, "Cruor = sangue") é a identidade da marca-mãe e
é deliberadamente distinto dos 4 acentos dos CRMs (azul/teal/magenta/violeta),
que só existem **dentro** do `AppShell`. O contraste claro↔escuro sinaliza
"estás entre apps" vs. "estás dentro de uma app".

### 4.2 Fluxo de navegação

```
sign-in  ──login──▶  /  (Hub)  ──cartão CRM──▶  /dashboard  (AppShell, CRM ativo)
                      ▲                              │
                      └────────  link "Hub"  ────────┘
```

`sign-in` / `sign-up` redirecionam para `/` após sucesso (não para `/dashboard`)
— a entrada é sempre pelo hub. O switcher de CRM continua dentro do `AppShell`.

### 4.3 Ficheiros

**Novos:**

| Ficheiro                              | Responsabilidade                                                        |
| ------------------------------------- | ----------------------------------------------------------------------- |
| `src/components/hub/EcosystemHub.tsx` | O hub completo: bento-grid + 6 cartões + atmosfera + animações          |
| `src/components/auth/auth-layout.tsx` | `AuthLayout`, `CruorWordmark`, `inputCls`, `ACCENT`, `EASE` partilhados |
| `src/routes/dashboard.tsx`            | Rota `/dashboard` — conteúdo do antigo `/` (KPIs, alertas, atividade…)  |
| `src/lib/mock-data/hub.ts`            | `ecosystemApps`, `crmSpaces`, `hubStats` + tipos                        |

**Alterados:**

| Ficheiro                     | Mudança                                                                         |
| ---------------------------- | ------------------------------------------------------------------------------- |
| `src/routes/index.tsx`       | `/` passa a renderizar `EcosystemHub` (era o `Dashboard`)                       |
| `src/routes/__root.tsx`      | conceito `isStandalone`; link "Hub" no header; `ROUTE_LABELS` ganha `dashboard` |
| `src/routes/sign-in.tsx`     | reescrito sobre `AuthLayout`; redirect pós-login → `/`                          |
| `src/routes/sign-up.tsx`     | reescrito sobre `AuthLayout`; redirect pós-signup → `/`                         |
| `src/lib/crm/presets.ts`     | nav Flora: item "Dashboard" aponta para `/dashboard` (era `/`)                  |
| `src/lib/mock-data/index.ts` | re-export de `./hub`                                                            |
| `package.json` / lockfile    | `framer-motion ^12.38.0`                                                        |

### 4.4 Modelo de dados (`lib/mock-data/hub.ts`)

```ts
type HubAppStatus = 'live' | 'soon';
interface HubApp   { id: string; name: string; tagline: string; status: HubAppStatus; }
interface HubTeamMember { initials: string; name: string; online: boolean; }
interface HubStats {
  revenueEur: number;     // receita agregada do ecossistema, 30 dias
  revenueDelta: string;   // ex. '+12,4%'
  team: HubTeamMember[];
  uptimePct: string;      // ex. '99,9%'
}

ecosystemApps: HubApp[]   // crm (live) · billing (soon) · flows (soon)
crmSpaces: { chip; name; swatch }[]   // os 4 espaços, para o cartão herói
hubStats: HubStats
```

## 5. Componentes

### 5.1 `EcosystemHub`

Superfície `bg-[#0A0A0C]`, 3 camadas de atmosfera, cabeçalho (wordmark + saudação
por hora do dia + data pt-PT + botão "Sair"), bento-grid e rodapé.

**Bento-grid** (`md:grid-cols-6`, `auto-rows-[172px]`), entrada com stagger:

| Cartão        | Span     | Navegável | Conteúdo                                                         |
| ------------- | -------- | --------- | ---------------------------------------------------------------- |
| `CrmHeroCard` | 3×2      | **sim**   | 4 chips dos espaços a flutuar; botão "Entrar" → `/dashboard`     |
| `RevenueCard` | 3×1      | não       | receita com count-up + equalizador animado                       |
| `TeamCard`    | 3×1      | não       | avatares; ciclo de "online agora" a cada 1,6 s                   |
| `SoonCard` ×2 | 2×1 cada | não       | Faturação / Automações; anel tracejado a rodar; badge "Em breve" |
| `SystemCard`  | 2×1      | não       | uptime; pulsos concêntricos verdes                               |

`AmbientCard` é a base partilhada dos 5 cartões não-navegáveis (`cursor-default`,
sem hover de navegação). `useCountUp` anima o número da receita.

### 5.2 `AuthLayout` (+ `CruorWordmark`, `inputCls`)

Moldura `lg:grid-cols-2`: painel de marca (esconde em mobile — wordmark, headline
"Quatro espaços. Um ecossistema.", chips Flora/Forge/Pulse/Studio) + slot de
conteúdo (`children` = cartão de formulário). Mesma atmosfera e acento do hub.
Exporta `inputCls` (input escuro com foco no acento via `--accent`) e as
constantes `ACCENT` / `EASE` para os ecrãs reutilizarem.

### 5.3 `sign-in` / `sign-up`

Lógica de auth **inalterada** (Better Auth: `signIn.email` / `signUp.email`,
validação Zod, `react-hook-form`). Só muda a apresentação: cartão
`bg-[#141416]` dentro do `AuthLayout`, toggle de visibilidade da password, erros
de servidor no acento. Redirect pós-sucesso → `/` (hub). `sign-up` mantém a nota
"esta conta fica como OWNER" e a mensagem amigável para `SIGNUP_DISABLED`.

## 6. Acessibilidade e movimento

- **`useReducedMotion`** respeitado em todos os componentes animados: com
  reduced-motion, o count-up salta para o valor final e os loops (flutuação,
  equalizador, pulsos, rotação) não arrancam.
- Os cartões ambiente são `<motion.div cursor-default>` — não são botões, não
  recebem foco; só o `CrmHeroCard` é um `<button>`.
- Toggle de password com `aria-label` dinâmico; checkbox "manter sessão" com
  estados de foco visíveis.

## 7. Tratamento de erros

- **Sessão ausente** — `/` e `/dashboard` mantêm `beforeLoad` com
  `authClient.getSession()` → `redirect({ to: '/sign-in' })`. O guard não muda
  com a mudança de rota.
- **Erros de auth** — inalterados: `serverError` renderizado no cartão, mensagem
  amigável para códigos conhecidos (`SIGNUP_DISABLED`).
- O hub não tem fontes de falha próprias — todos os dados são mock síncronos.

## 8. Verificação

O `frontend` não tem test runner. Verificação:

1. `pnpm typecheck` — **PASS** (confirmado).
2. `pnpm lint` — **PASS** (confirmado).
3. **Manual no browser** (backend + frontend a correr):
   - Login → aterra em `/` (hub escuro), não no dashboard.
   - Cartão "CRM" → navega para `/dashboard` dentro do `AppShell` (tema do CRM
     ativo, sidebar).
   - Link "Hub" no header → volta a `/`.
   - Cartões ambiente não navegam; animações correm; com reduced-motion ficam
     estáticos.
   - `sign-in` / `sign-up` → moldura escura, formulários funcionam, toggle de
     password, erros visíveis.
   - Sidebar do CRM Flora → item "Dashboard" abre `/dashboard` (não `/`).
   - Reload em `/dashboard` sem sessão → redirect a `/sign-in`.

## 9. Limpeza antes do commit

- Apagar (ou `.gitignore`) os 8 PNGs de scratch na raiz do repo:
  `btn-check.png`, `btn-check2.png`, `cruor-dashboard.png`, `cruor-final.png`,
  `cruor-leads.png`, `cruor_logo_dark.png`, `cruor_logo_light.png`,
  `dashboard-smoke.png`.
  Nota: `cruor_logo_dark.png` / `cruor_logo_light.png` **já existem** em
  `frontend/public/` — as cópias na raiz são duplicados a descartar.
- Confirmar que o commit não arrasta nenhum desses PNGs.

## 10. Sequência (já implementada — ordem lógica para a revisão)

1. `lib/mock-data/hub.ts` + re-export em `lib/mock-data/index.ts`.
2. `components/auth/auth-layout.tsx`.
3. `routes/sign-in.tsx` + `routes/sign-up.tsx` sobre o `AuthLayout`.
4. `components/hub/EcosystemHub.tsx`.
5. `routes/dashboard.tsx` (move do conteúdo) + `lib/crm/presets.ts` (nav → `/dashboard`).
6. `routes/index.tsx` → `EcosystemHub`.
7. `routes/__root.tsx` → `isStandalone` + link "Hub".
8. `package.json` → `framer-motion`.

O detalhe de commits (atómicos vs. um só) fica para o plano de implementação —
mas, sendo a feature já escrita, o "plano" aqui é sobretudo **estratégia de
commit** + a verificação manual pendente.
