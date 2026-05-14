# Multi-CRM Switcher Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Tornar o switcher de organização funcional — alternar entre 4 CRMs (Flora, Forge, Pulse, Studio), cada um com acento, temperatura de neutros e tópicos de navegação próprios.

**Architecture:** Theming em runtime via CSS variables — as escalas `cruor` e `neutral` do Tailwind passam a `rgb(var(--…) / <alpha-value>)`. Cada CRM é um preset frontend (cores como triplos RGB + config de nav). Um `CrmProvider` guarda o CRM ativo, persiste em `localStorage` e escreve as variáveis no `<html>`. Sem multi-tenancy de backend — dados continuam mock.

**Tech Stack:** React 18, TanStack Router (file-based), Tailwind CSS 3, TypeScript, lucide-react.

**Nota de verificação:** O `frontend` não tem test runner (sem script `test` no `package.json`). A verificação de cada tarefa é `pnpm typecheck` (que corre `tsr generate && tsc --noEmit`) e, na última tarefa, `pnpm lint` + verificação manual no browser. Todos os comandos correm a partir de `frontend/`.

**Spec:** `docs/superpowers/specs/2026-05-14-multi-crm-switcher-design.md`

---

## File Structure

**Novos — `frontend/src/lib/crm/`:**

| Ficheiro          | Responsabilidade                                                      |
| ----------------- | --------------------------------------------------------------------- |
| `types.ts`        | `CrmId`, `Shade`, `NavItem`, `NavGroup`, `CrmPreset`                  |
| `presets.ts`      | Os 4 `CrmPreset` + `CRMS`, `DEFAULT_CRM_ID`, `getCrmPreset(id)`       |
| `theme.ts`        | `CRM_STORAGE_KEY`, `applyCrmTheme`, `readStoredCrmId`, `initCrmTheme` |
| `CrmProvider.tsx` | `CrmProvider` + `useCrm()` hook                                       |

**Novo — rota:** `frontend/src/routes/m.$slug.tsx` — página placeholder "módulo de exemplo".

**Alterados:** `frontend/tailwind.config.ts`, `frontend/src/styles/globals.css`, `frontend/src/main.tsx`, `frontend/src/routes/__root.tsx`.

---

## Task 1: Tipos do CRM

**Files:**

- Create: `frontend/src/lib/crm/types.ts`

- [ ] **Step 1: Criar o ficheiro de tipos**

```ts
// frontend/src/lib/crm/types.ts
import type { LucideIcon } from 'lucide-react';

export type CrmId = 'florista' | 'forge' | 'pulse' | 'studio';

export type Shade = 50 | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900 | 950;

export interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  /** Badge "mock" na sidebar (usado pelo CRM Flora nas páginas ainda não ligadas). */
  mock?: boolean;
}

export interface NavGroup {
  groupLabel: string;
  items: NavItem[];
}

export interface CrmPreset {
  id: CrmId;
  /** Título no switcher — ex. 'Cruor Forge'. */
  name: string;
  /** Subtítulo no switcher — ex. 'Software à medida'. */
  area: string;
  /** 1–2 chars no chip colorido do switcher. */
  chip: string;
  /** Hex do acento, para o ponto de cor no dropdown. */
  swatch: string;
  /** Escalas de cor como triplos RGB separados por espaço: '53 104 224'. */
  colors: {
    cruor: Record<Shade, string>;
    neutral: Record<Shade, string>;
  };
  navGroups: NavGroup[];
}
```

- [ ] **Step 2: Verificar que compila**

Run: `pnpm typecheck`
Expected: PASS (sem erros). O ficheiro ainda não é importado por ninguém — só valida a sintaxe e os tipos.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/lib/crm/types.ts
git commit -m "feat(frontend): tipos do multi-CRM switcher"
```

---

## Task 2: Presets dos 4 CRMs

**Files:**

- Create: `frontend/src/lib/crm/presets.ts`

- [ ] **Step 1: Criar o ficheiro de presets**

Contém os 4 objetos `CrmPreset`. As escalas de cor vêm da spec §5.2/§5.3; a config de nav da §5.4. O CRM Flora reproduz o `NAV_GROUPS` que hoje está hardcoded em `__root.tsx` (com badges `mock` e rotas reais). Forge/Pulse/Studio têm todos os `to` a apontar para `/m/<slug>`.

```ts
// frontend/src/lib/crm/presets.ts
import {
  BarChart3,
  Bot,
  Boxes,
  Briefcase,
  Calendar,
  Contact,
  FileSignature,
  FileText,
  Flag,
  Gauge,
  Globe,
  Image,
  Inbox,
  Layers,
  LayoutDashboard,
  ListChecks,
  Mail,
  MapPin,
  Megaphone,
  Package,
  Paintbrush,
  Palette,
  Printer,
  Receipt,
  Route as RouteIcon,
  Search,
  Settings,
  Share2,
  ShoppingCart,
  Tag,
  Target,
  Timer,
  TrendingUp,
  Truck,
  Undo2,
  UserPlus,
  Users,
  Video,
  Wallet,
} from 'lucide-react';

import type { CrmId, CrmPreset, NavGroup } from './types';

export const DEFAULT_CRM_ID: CrmId = 'florista';

// ---- Nav: Cruor Flora (igual ao NAV_GROUPS atual, rotas reais) ----------
const FLORISTA_NAV: NavGroup[] = [
  {
    groupLabel: 'Visão Geral',
    items: [{ to: '/', label: 'Dashboard', icon: LayoutDashboard }],
  },
  {
    groupLabel: 'Comercial',
    items: [
      { to: '/customers', label: 'Floristas', icon: Users },
      { to: '/leads', label: 'Potenciais', icon: UserPlus },
      { to: '/inbox', label: 'Inbox', icon: Inbox, mock: true },
      { to: '/visits', label: 'Visitas', icon: MapPin, mock: true },
      { to: '/routes', label: 'Rotas', icon: RouteIcon, mock: true },
    ],
  },
  {
    groupLabel: 'Catálogo',
    items: [
      { to: '/products', label: 'Produtos', icon: Package },
      { to: '/pricing', label: 'Preços', icon: Tag, mock: true },
      { to: '/catalogs', label: 'Catálogos PDF', icon: FileText, mock: true },
    ],
  },
  {
    groupLabel: 'Encomendas',
    items: [
      { to: '/orders', label: 'Encomendas', icon: ShoppingCart, mock: true },
      { to: '/returns', label: 'Devoluções', icon: Undo2, mock: true },
    ],
  },
  {
    groupLabel: 'Operações',
    items: [
      { to: '/stock', label: 'Stock', icon: Boxes },
      { to: '/suppliers', label: 'Fornecedores', icon: Truck },
      { to: '/alibaba', label: 'Alibaba', icon: Globe, mock: true },
    ],
  },
  {
    groupLabel: 'IA & Conteúdo',
    items: [
      { to: '/chatbot', label: 'Chatbot', icon: Bot, mock: true },
      { to: '/meetings', label: 'Reuniões', icon: Video, mock: true },
      { to: '/scraping', label: 'Scraping', icon: Search, mock: true },
    ],
  },
  {
    groupLabel: 'Marketing',
    items: [
      { to: '/campaigns', label: 'Campanhas', icon: Megaphone, mock: true },
      { to: '/email', label: 'Email marketing', icon: Mail, mock: true },
      { to: '/social', label: 'Redes sociais', icon: Share2, mock: true },
    ],
  },
  {
    groupLabel: 'Reports',
    items: [
      { to: '/reports/margins', label: 'Margens', icon: TrendingUp, mock: true },
      { to: '/reports/commissions', label: 'Comissões', icon: Wallet, mock: true },
      { to: '/reports/abc', label: 'ABC clientes', icon: BarChart3, mock: true },
    ],
  },
  {
    groupLabel: 'Definições',
    items: [{ to: '/settings', label: 'Organização', icon: Settings }],
  },
];

// ---- Nav: Cruor Forge (software à medida) — placeholders /m/<slug> ------
const FORGE_NAV: NavGroup[] = [
  {
    groupLabel: 'Visão Geral',
    items: [{ to: '/m/dashboard', label: 'Dashboard', icon: LayoutDashboard }],
  },
  {
    groupLabel: 'Comercial',
    items: [
      { to: '/m/clientes', label: 'Clientes', icon: Users },
      { to: '/m/leads', label: 'Leads', icon: UserPlus },
      { to: '/m/propostas', label: 'Propostas', icon: FileText },
      { to: '/m/contratos', label: 'Contratos', icon: FileSignature },
    ],
  },
  {
    groupLabel: 'Entrega',
    items: [
      { to: '/m/projetos', label: 'Projetos', icon: Briefcase },
      { to: '/m/sprints', label: 'Sprints', icon: Flag },
      { to: '/m/tarefas', label: 'Tarefas', icon: ListChecks },
      { to: '/m/time-tracking', label: 'Time tracking', icon: Timer },
    ],
  },
  {
    groupLabel: 'Equipa',
    items: [
      { to: '/m/membros', label: 'Membros', icon: Contact },
      { to: '/m/capacidade', label: 'Capacidade', icon: Gauge },
    ],
  },
  {
    groupLabel: 'Financeiro',
    items: [
      { to: '/m/faturacao', label: 'Faturação', icon: Receipt },
      { to: '/m/relatorios', label: 'Relatórios', icon: BarChart3 },
    ],
  },
  {
    groupLabel: 'Definições',
    items: [{ to: '/m/definicoes', label: 'Organização', icon: Settings }],
  },
];

// ---- Nav: Cruor Pulse (marketing) — placeholders /m/<slug> --------------
const PULSE_NAV: NavGroup[] = [
  {
    groupLabel: 'Visão Geral',
    items: [{ to: '/m/dashboard', label: 'Dashboard', icon: LayoutDashboard }],
  },
  {
    groupLabel: 'Comercial',
    items: [
      { to: '/m/clientes', label: 'Clientes', icon: Users },
      { to: '/m/leads', label: 'Leads', icon: UserPlus },
      { to: '/m/orcamentos', label: 'Orçamentos', icon: FileText },
    ],
  },
  {
    groupLabel: 'Campanhas',
    items: [
      { to: '/m/campanhas', label: 'Campanhas', icon: Megaphone },
      { to: '/m/calendario', label: 'Calendário de conteúdo', icon: Calendar },
      { to: '/m/anuncios', label: 'Anúncios', icon: Target },
    ],
  },
  {
    groupLabel: 'Conteúdo',
    items: [
      { to: '/m/redes-sociais', label: 'Redes sociais', icon: Share2 },
      { to: '/m/email', label: 'Email marketing', icon: Mail },
      { to: '/m/criativos', label: 'Criativos & Assets', icon: Image },
    ],
  },
  {
    groupLabel: 'Análise',
    items: [
      { to: '/m/analytics', label: 'Analytics', icon: TrendingUp },
      { to: '/m/relatorios', label: 'Relatórios', icon: BarChart3 },
    ],
  },
  {
    groupLabel: 'Definições',
    items: [{ to: '/m/definicoes', label: 'Organização', icon: Settings }],
  },
];

// ---- Nav: Cruor Studio (design 3D) — placeholders /m/<slug> -------------
const STUDIO_NAV: NavGroup[] = [
  {
    groupLabel: 'Visão Geral',
    items: [{ to: '/m/dashboard', label: 'Dashboard', icon: LayoutDashboard }],
  },
  {
    groupLabel: 'Comercial',
    items: [
      { to: '/m/clientes', label: 'Clientes', icon: Users },
      { to: '/m/encomendas', label: 'Encomendas', icon: ShoppingCart },
      { to: '/m/orcamentos', label: 'Orçamentos', icon: FileText },
    ],
  },
  {
    groupLabel: 'Catálogo',
    items: [
      { to: '/m/modelos', label: 'Modelos & Peças', icon: Boxes },
      { to: '/m/galeria', label: 'Galeria', icon: Image },
      { to: '/m/ficheiros-3d', label: 'Ficheiros 3D', icon: Layers },
    ],
  },
  {
    groupLabel: 'Produção',
    items: [
      { to: '/m/impressao', label: 'Fila de impressão', icon: Printer },
      { to: '/m/materiais', label: 'Materiais', icon: Palette },
      { to: '/m/acabamento', label: 'Acabamento & Pintura', icon: Paintbrush },
    ],
  },
  {
    groupLabel: 'Financeiro',
    items: [
      { to: '/m/faturacao', label: 'Faturação', icon: Receipt },
      { to: '/m/relatorios', label: 'Relatórios', icon: BarChart3 },
    ],
  },
  {
    groupLabel: 'Definições',
    items: [{ to: '/m/definicoes', label: 'Organização', icon: Settings }],
  },
];

export const CRMS: CrmPreset[] = [
  {
    id: 'florista',
    name: 'Cruor Flora',
    area: 'Florista B2B',
    chip: 'Fl',
    swatch: '#3568E0',
    colors: {
      cruor: {
        50: '239 244 254',
        100: '220 231 253',
        200: '191 210 251',
        300: '149 180 247',
        400: '104 142 241',
        500: '71 111 232',
        600: '53 104 224',
        700: '42 79 192',
        800: '39 66 155',
        900: '37 60 123',
        950: '26 38 75',
      },
      neutral: {
        50: '248 249 250',
        100: '238 240 242',
        200: '227 229 233',
        300: '208 211 217',
        400: '165 170 179',
        500: '124 130 140',
        600: '90 96 107',
        700: '63 68 78',
        800: '39 43 51',
        900: '23 26 31',
        950: '13 15 18',
      },
    },
    navGroups: FLORISTA_NAV,
  },
  {
    id: 'forge',
    name: 'Cruor Forge',
    area: 'Software à medida',
    chip: 'Fg',
    swatch: '#0E8C7C',
    colors: {
      cruor: {
        50: '236 251 248',
        100: '205 243 236',
        200: '157 230 217',
        300: '100 208 191',
        400: '50 181 162',
        500: '25 156 138',
        600: '14 140 124',
        700: '12 112 101',
        800: '14 90 82',
        900: '16 74 68',
        950: '4 43 40',
      },
      neutral: {
        50: '247 249 251',
        100: '236 239 243',
        200: '224 228 234',
        300: '205 210 219',
        400: '161 168 181',
        500: '119 127 142',
        600: '85 93 109',
        700: '59 66 80',
        800: '36 40 51',
        900: '21 24 31',
        950: '12 14 18',
      },
    },
    navGroups: FORGE_NAV,
  },
  {
    id: 'pulse',
    name: 'Cruor Pulse',
    area: 'Marketing para empresas',
    chip: 'Pl',
    swatch: '#C02C5E',
    colors: {
      cruor: {
        50: '253 238 243',
        100: '250 216 227',
        200: '244 178 200',
        300: '236 133 166',
        400: '226 89 133',
        500: '211 58 109',
        600: '192 44 94',
        700: '159 36 78',
        800: '131 32 66',
        900: '110 30 58',
        950: '64 12 31',
      },
      neutral: {
        50: '250 249 248',
        100: '241 240 238',
        200: '231 229 226',
        300: '214 211 207',
        400: '171 168 162',
        500: '131 127 121',
        600: '97 93 87',
        700: '69 66 61',
        800: '44 42 39',
        900: '26 25 23',
        950: '16 15 13',
      },
    },
    navGroups: PULSE_NAV,
  },
  {
    id: 'studio',
    name: 'Cruor Studio',
    area: 'Design 3D de figuras',
    chip: 'St',
    swatch: '#7233D6',
    colors: {
      cruor: {
        50: '244 239 254',
        100: '232 222 252',
        200: '210 191 249',
        300: '182 151 244',
        400: '153 107 236',
        500: '130 73 228',
        600: '114 51 214',
        700: '95 40 180',
        800: '79 35 147',
        900: '66 30 120',
        950: '42 17 80',
      },
      neutral: {
        50: '250 248 245',
        100: '241 238 233',
        200: '231 226 218',
        300: '214 207 195',
        400: '171 162 146',
        500: '131 122 107',
        600: '97 90 78',
        700: '69 63 55',
        800: '44 40 35',
        900: '26 23 20',
        950: '16 14 12',
      },
    },
    navGroups: STUDIO_NAV,
  },
];

export function getCrmPreset(id: CrmId): CrmPreset {
  return CRMS.find((c) => c.id === id) ?? CRMS[0];
}
```

- [ ] **Step 2: Verificar que compila**

Run: `pnpm typecheck`
Expected: PASS. Confirma que todos os ícones lucide existem e que os objetos satisfazem `CrmPreset` (escalas com todos os shades 50–950).

- [ ] **Step 3: Commit**

```bash
git add frontend/src/lib/crm/presets.ts
git commit -m "feat(frontend): presets dos 4 CRMs (cores + nav)"
```

---

## Task 3: Theming via CSS variables (Tailwind + globals.css)

**Files:**

- Modify: `frontend/tailwind.config.ts` — escalas `cruor` e `neutral`
- Modify: `frontend/src/styles/globals.css` — vars por omissão no `:root`

Esta tarefa muda as duas peças em conjunto para a app continuar a renderizar coerente (o `:root` traz os defaults do tema Flora; o `applyCrmTheme` da Task 4 sobrepõe-os em runtime).

- [ ] **Step 1: Substituir as escalas `cruor` e `neutral` no Tailwind config**

Em `frontend/tailwind.config.ts`, substituir o bloco da escala `cruor` (atualmente valores hex `50`–`950`) e o bloco da escala `neutral` (idem) por referências a CSS variables. As escalas `green`, `amber`, `blue`, `red` e `ink` **não mudam**.

Bloco `cruor` novo:

```ts
        // Marca — acento do CRM ativo. Valores em CSS vars (ver globals.css +
        // lib/crm/theme.ts); trocam em runtime ao mudar de CRM.
        cruor: {
          50: 'rgb(var(--cruor-50) / <alpha-value>)',
          100: 'rgb(var(--cruor-100) / <alpha-value>)',
          200: 'rgb(var(--cruor-200) / <alpha-value>)',
          300: 'rgb(var(--cruor-300) / <alpha-value>)',
          400: 'rgb(var(--cruor-400) / <alpha-value>)',
          500: 'rgb(var(--cruor-500) / <alpha-value>)',
          600: 'rgb(var(--cruor-600) / <alpha-value>)',
          700: 'rgb(var(--cruor-700) / <alpha-value>)',
          800: 'rgb(var(--cruor-800) / <alpha-value>)',
          900: 'rgb(var(--cruor-900) / <alpha-value>)',
          950: 'rgb(var(--cruor-950) / <alpha-value>)',
        },
```

Bloco `neutral` novo:

```ts
        // Estrutura — neutros do CRM ativo (temperatura varia por CRM). CSS vars.
        neutral: {
          50: 'rgb(var(--neutral-50) / <alpha-value>)',
          100: 'rgb(var(--neutral-100) / <alpha-value>)',
          200: 'rgb(var(--neutral-200) / <alpha-value>)',
          300: 'rgb(var(--neutral-300) / <alpha-value>)',
          400: 'rgb(var(--neutral-400) / <alpha-value>)',
          500: 'rgb(var(--neutral-500) / <alpha-value>)',
          600: 'rgb(var(--neutral-600) / <alpha-value>)',
          700: 'rgb(var(--neutral-700) / <alpha-value>)',
          800: 'rgb(var(--neutral-800) / <alpha-value>)',
          900: 'rgb(var(--neutral-900) / <alpha-value>)',
          950: 'rgb(var(--neutral-950) / <alpha-value>)',
        },
```

- [ ] **Step 2: Adicionar as vars por omissão (tema Flora) ao `:root` em globals.css**

Em `frontend/src/styles/globals.css`, dentro do bloco `:root { … }` existente, adicionar as 22 variáveis logo a seguir a `color-scheme: light;` (antes dos tokens `--shadow-*`):

```css
/* Tema CRM por omissão (Cruor Flora). Sobreposto em runtime por
     applyCrmTheme() — ver src/lib/crm/theme.ts. */
--cruor-50: 239 244 254;
--cruor-100: 220 231 253;
--cruor-200: 191 210 251;
--cruor-300: 149 180 247;
--cruor-400: 104 142 241;
--cruor-500: 71 111 232;
--cruor-600: 53 104 224;
--cruor-700: 42 79 192;
--cruor-800: 39 66 155;
--cruor-900: 37 60 123;
--cruor-950: 26 38 75;
--neutral-50: 248 249 250;
--neutral-100: 238 240 242;
--neutral-200: 227 229 233;
--neutral-300: 208 211 217;
--neutral-400: 165 170 179;
--neutral-500: 124 130 140;
--neutral-600: 90 96 107;
--neutral-700: 63 68 78;
--neutral-800: 39 43 51;
--neutral-900: 23 26 31;
--neutral-950: 13 15 18;
```

- [ ] **Step 3: Verificar que compila**

Run: `pnpm typecheck`
Expected: PASS. (O `typecheck` valida o TS do config; o efeito visual confirma-se na Task 9.)

- [ ] **Step 4: Commit**

```bash
git add frontend/tailwind.config.ts frontend/src/styles/globals.css
git commit -m "feat(frontend): escalas cruor/neutral via CSS variables"
```

---

## Task 4: Módulo de tema (`theme.ts`)

**Files:**

- Create: `frontend/src/lib/crm/theme.ts`

- [ ] **Step 1: Criar o módulo de tema**

```ts
// frontend/src/lib/crm/theme.ts
import { CRMS, DEFAULT_CRM_ID, getCrmPreset } from './presets';
import type { CrmId, CrmPreset, Shade } from './types';

export const CRM_STORAGE_KEY = 'cruor:active-crm';

const SHADES: Shade[] = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];

/** Escreve as ~22 CSS vars + data-crm no <html>. Sem modo de falha realista. */
export function applyCrmTheme(preset: CrmPreset): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  for (const shade of SHADES) {
    root.style.setProperty(`--cruor-${shade}`, preset.colors.cruor[shade]);
    root.style.setProperty(`--neutral-${shade}`, preset.colors.neutral[shade]);
  }
  root.dataset.crm = preset.id;
}

/**
 * Lê o CRM ativo do localStorage. Se faltar ou for inválido, cai para o
 * DEFAULT_CRM_ID e reescreve a chave (spec §7).
 */
export function readStoredCrmId(): CrmId {
  if (typeof window === 'undefined') return DEFAULT_CRM_ID;
  const stored = window.localStorage.getItem(CRM_STORAGE_KEY);
  if (stored && CRMS.some((c) => c.id === stored)) {
    return stored as CrmId;
  }
  window.localStorage.setItem(CRM_STORAGE_KEY, DEFAULT_CRM_ID);
  return DEFAULT_CRM_ID;
}

/** Corre antes do React (main.tsx): aplica o tema guardado, sem flash. */
export function initCrmTheme(): CrmId {
  const id = readStoredCrmId();
  applyCrmTheme(getCrmPreset(id));
  return id;
}
```

- [ ] **Step 2: Verificar que compila**

Run: `pnpm typecheck`
Expected: PASS. O módulo ainda não é importado — só valida.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/lib/crm/theme.ts
git commit -m "feat(frontend): módulo de tema (apply/read/init)"
```

---

## Task 5: `CrmProvider` + `useCrm()`

**Files:**

- Create: `frontend/src/lib/crm/CrmProvider.tsx`

- [ ] **Step 1: Criar o provider e o hook**

```tsx
// frontend/src/lib/crm/CrmProvider.tsx
import { createContext, useCallback, useContext, useState } from 'react';
import type { ReactNode } from 'react';

import { CRMS, getCrmPreset } from './presets';
import { applyCrmTheme, CRM_STORAGE_KEY, readStoredCrmId } from './theme';
import type { CrmId, CrmPreset } from './types';

interface CrmContextValue {
  activeCrm: CrmPreset;
  crms: CrmPreset[];
  /** Atualiza o CRM ativo: state + localStorage + tema. NÃO navega. */
  setCrm: (id: CrmId) => void;
}

const CrmContext = createContext<CrmContextValue | null>(null);

export function CrmProvider({ children }: { children: ReactNode }) {
  const [activeCrmId, setActiveCrmId] = useState<CrmId>(() => readStoredCrmId());

  const setCrm = useCallback((id: CrmId) => {
    setActiveCrmId(id);
    window.localStorage.setItem(CRM_STORAGE_KEY, id);
    applyCrmTheme(getCrmPreset(id));
  }, []);

  const value: CrmContextValue = {
    activeCrm: getCrmPreset(activeCrmId),
    crms: CRMS,
    setCrm,
  };

  return <CrmContext.Provider value={value}>{children}</CrmContext.Provider>;
}

export function useCrm(): CrmContextValue {
  const ctx = useContext(CrmContext);
  if (!ctx) {
    throw new Error('useCrm deve ser usado dentro de <CrmProvider>');
  }
  return ctx;
}
```

- [ ] **Step 2: Verificar que compila**

Run: `pnpm typecheck`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/lib/crm/CrmProvider.tsx
git commit -m "feat(frontend): CrmProvider + useCrm hook"
```

---

## Task 6: Ligar o provider em `main.tsx`

**Files:**

- Modify: `frontend/src/main.tsx`

Após esta tarefa o `useCrm()` fica disponível em toda a app e o tema guardado é aplicado antes do primeiro paint. O `__root.tsx` ainda não consome o provider — a app continua a funcionar com o switcher estático.

- [ ] **Step 1: Substituir o conteúdo de `main.tsx`**

O ficheiro atual tem `initCrmTheme()` por adicionar e falta embrulhar a app em `<CrmProvider>`. Conteúdo novo completo:

```tsx
// frontend/src/main.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider, createRouter } from '@tanstack/react-router';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import '@fontsource-variable/hanken-grotesk';
import '@fontsource-variable/jetbrains-mono';
import './styles/globals.css';
import { CrmProvider } from './lib/crm/CrmProvider';
import { initCrmTheme } from './lib/crm/theme';
import { routeTree } from './routeTree.gen';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 60 * 1000, retry: 1 },
  },
});

const router = createRouter({
  routeTree,
  context: { queryClient },
  defaultPreload: 'intent',
});

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

const container = document.getElementById('root');
if (!container) throw new Error('Missing #root');

// Aplica o tema do CRM guardado antes do primeiro paint (evita flash).
initCrmTheme();

createRoot(container).render(
  <StrictMode>
    <CrmProvider>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </CrmProvider>
  </StrictMode>,
);
```

- [ ] **Step 2: Verificar que compila**

Run: `pnpm typecheck`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/main.tsx
git commit -m "feat(frontend): init de tema + CrmProvider no main"
```

---

## Task 7: Rota placeholder `/m/$slug`

**Files:**

- Create: `frontend/src/routes/m.$slug.tsx`
- Modify (gerado): `frontend/src/routeTree.gen.ts` — atualizado por `tsr generate`

- [ ] **Step 1: Criar a rota placeholder**

```tsx
// frontend/src/routes/m.$slug.tsx
import { createFileRoute, redirect } from '@tanstack/react-router';
import { Sparkles } from 'lucide-react';

import { PageHeader } from '@/components/ui/PageHeader';
import { authClient } from '@/lib/auth-client';
import { useCrm } from '@/lib/crm/CrmProvider';

export const Route = createFileRoute('/m/$slug')({
  component: ModulePlaceholder,
  beforeLoad: async () => {
    const { data } = await authClient.getSession();
    if (!data) {
      throw redirect({ to: '/sign-in' });
    }
  },
});

function humanizeSlug(slug: string): string {
  const s = slug.replace(/-/g, ' ');
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function ModulePlaceholder() {
  const { slug } = Route.useParams();
  const { activeCrm } = useCrm();

  // Procura o item de nav correspondente no CRM ativo para o título/ícone reais.
  let label = humanizeSlug(slug);
  let groupLabel = '';
  let Icon = Sparkles;
  for (const group of activeCrm.navGroups) {
    const item = group.items.find((i) => i.to === `/m/${slug}`);
    if (item) {
      label = item.label;
      groupLabel = group.groupLabel;
      Icon = item.icon;
      break;
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title={label} subtitle={groupLabel || activeCrm.area} />
      <div className="flex flex-col items-center justify-center rounded-card border border-neutral-200 bg-white px-6 py-20 text-center shadow-card">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-cruor-50 text-cruor-600">
          <Icon size={26} />
        </span>
        <h2 className="mt-5 text-lg font-semibold text-neutral-900">{label}</h2>
        <p className="mt-1.5 max-w-sm text-sm text-neutral-500">
          Módulo de exemplo do CRM{' '}
          <span className="font-medium text-neutral-700">{activeCrm.name}</span>. Esta área
          demonstra a estrutura de navegação — ainda sem ecrã dedicado.
        </p>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Gerar a route tree e verificar que compila**

Run: `pnpm typecheck`
Expected: PASS. O script `typecheck` corre `tsr generate` primeiro, o que regenera `routeTree.gen.ts` com a rota `/m/$slug`.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/routes/m.\$slug.tsx frontend/src/routeTree.gen.ts
git commit -m "feat(frontend): rota placeholder /m/\$slug para módulos de exemplo"
```

---

## Task 8: Refactor do `__root.tsx` — switcher dropdown + nav do CRM ativo

**Files:**

- Modify: `frontend/src/routes/__root.tsx` (reescrita completa)

O `__root.tsx` deixa de ter `NAV_GROUPS`, `NavItem` e `NavGroup` (vêm de `lib/crm`). O switcher estático passa a `CrmSwitcher` (dropdown). A nav passa a vir de `useCrm().activeCrm.navGroups`. A `Breadcrumb` ganha o label `m → 'Módulos'`.

- [ ] **Step 1: Reescrever `__root.tsx` por completo**

```tsx
// frontend/src/routes/__root.tsx
import type { QueryClient } from '@tanstack/react-query';
import {
  Link,
  Outlet,
  createRootRouteWithContext,
  useNavigate,
  useRouterState,
} from '@tanstack/react-router';
import {
  Bell,
  Check,
  ChevronRight,
  ChevronsUpDown,
  Home,
  LogOut,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  X,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { Button } from '@/components/ui/Button';
import { signOut, useSession } from '@/lib/auth-client';
import { useCrm } from '@/lib/crm/CrmProvider';
import type { CrmId, NavGroup, NavItem } from '@/lib/crm/types';

export interface RouterContext {
  queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootLayout,
});

// Mapeamento de segmentos de rota para labels pt-PT
const ROUTE_LABELS: Record<string, string> = {
  '': 'Dashboard',
  m: 'Módulos',
  customers: 'Floristas',
  leads: 'Potenciais',
  inbox: 'Inbox',
  visits: 'Visitas',
  routes: 'Rotas',
  products: 'Produtos',
  pricing: 'Preços',
  catalogs: 'Catálogos PDF',
  orders: 'Encomendas',
  returns: 'Devoluções',
  stock: 'Stock',
  suppliers: 'Fornecedores',
  alibaba: 'Alibaba',
  chatbot: 'Chatbot',
  meetings: 'Reuniões',
  scraping: 'Scraping',
  campaigns: 'Campanhas',
  email: 'Email Marketing',
  social: 'Redes Sociais',
  reports: 'Reports',
  margins: 'Margens',
  commissions: 'Comissões',
  abc: 'ABC Clientes',
  settings: 'Organização',
};

function humanizeSegment(segment: string): string {
  const mapped = ROUTE_LABELS[segment];
  if (mapped !== undefined) return mapped;
  // Segmentos dinâmicos (IDs, slugs) — capitaliza e abrevia
  if (segment.length > 12) return segment.slice(0, 8) + '…';
  return segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' ');
}

/**
 * Marca Cruor desenhada em CSS — o "O" planetário do logótipo. Vive dentro de
 * um chip navy, escala em qualquer tamanho (header, rail colapsado, favicon).
 */
function RingMark({ className = '' }: { className?: string }) {
  return (
    <span
      className={`relative grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-ink-900 ${className}`}
      aria-hidden
    >
      <span className="h-2.5 w-2.5 rounded-full border-2 border-neutral-200" />
      <span className="absolute h-1.5 w-7 -rotate-[28deg] rounded-full border border-cruor-400 shadow-[0_0_10px_rgb(53_104_224_/_0.55)]" />
    </span>
  );
}

function Breadcrumb({ pathname }: { pathname: string }) {
  const segments = pathname.replace(/\/$/, '').split('/').filter(Boolean);

  if (segments.length === 0) {
    return (
      <div className="flex items-center gap-1.5 text-[13px]">
        <Home className="h-3.5 w-3.5 text-neutral-400" />
        <span className="font-semibold text-neutral-900">Dashboard</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1 text-[13px]">
      <Link
        to="/"
        className="flex items-center text-neutral-400 transition-colors hover:text-cruor-600"
      >
        <Home className="h-3.5 w-3.5" />
      </Link>
      {segments.map((segment, idx) => {
        const isLast = idx === segments.length - 1;
        return (
          <span key={idx} className="flex items-center gap-1">
            <ChevronRight className="h-3.5 w-3.5 text-neutral-300" />
            {isLast ? (
              <span className="font-semibold text-neutral-900">{humanizeSegment(segment)}</span>
            ) : (
              <span className="text-neutral-500">{humanizeSegment(segment)}</span>
            )}
          </span>
        );
      })}
    </div>
  );
}

function RootLayout() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const isAuthRoute = path.startsWith('/sign-');

  if (isAuthRoute) return <Outlet />;

  return <AppShell />;
}

const COLLAPSE_KEY = 'cruor:sidebar-collapsed';

function AppShell() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  // Estado do rail colapsado — persistido entre sessões. Só afecta md+.
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.localStorage.getItem(COLLAPSE_KEY) === '1';
  });
  const { data: session } = useSession();
  const { activeCrm } = useCrm();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    window.localStorage.setItem(COLLAPSE_KEY, collapsed ? '1' : '0');
  }, [collapsed]);

  const handleSignOut = async () => {
    await signOut();
    window.location.href = '/sign-in';
  };

  const closeDrawer = () => setDrawerOpen(false);

  const userName = session?.user.name ?? session?.user.email ?? 'U';
  const initials = userName
    .split(/[\s@]+/)
    .slice(0, 2)
    .map((part: string) => part[0]?.toUpperCase() ?? '')
    .join('');

  return (
    <div className="flex h-screen overflow-hidden">
      {drawerOpen && (
        <div
          className="fixed inset-0 z-20 bg-ink-950/40 backdrop-blur-[2px] md:hidden"
          onClick={closeDrawer}
        />
      )}

      {/* Sidebar — superfície branca, leve, separada do canvas por um fio */}
      <aside
        className={`fixed inset-y-0 left-0 z-30 flex w-[270px] flex-col border-r border-neutral-200 bg-white transition-[width,transform] duration-300 ease-spring md:static md:translate-x-0 ${
          drawerOpen ? 'translate-x-0' : '-translate-x-full'
        } ${collapsed ? 'md:w-[76px]' : 'md:w-[270px]'}`}
      >
        {/* Logo lockup */}
        <div className="relative flex h-16 shrink-0 items-center px-3.5">
          <Link
            to="/"
            className="flex min-w-0 items-center gap-2.5"
            onClick={closeDrawer}
            aria-label="Cruor — início"
          >
            <RingMark />
            <span className={`flex min-w-0 flex-col leading-none ${collapsed ? 'md:hidden' : ''}`}>
              <span className="text-[15px] font-semibold tracking-tight text-neutral-900">
                Cruor
              </span>
              <span className="mt-1 text-[11px] text-neutral-400">Multi-CRM</span>
            </span>
          </Link>
          <button
            type="button"
            className="ml-auto rounded-control p-1 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-700 md:hidden"
            onClick={closeDrawer}
            aria-label="Fechar menu"
          >
            <X size={16} />
          </button>
        </div>

        {/* Switcher de CRM */}
        <div className={`pb-1 ${collapsed ? 'md:px-2' : ''} px-3`}>
          <CrmSwitcher collapsed={collapsed} onNavigate={closeDrawer} />
        </div>

        {/* Nav groups — do CRM ativo */}
        <nav className={`flex-1 overflow-y-auto py-3 ${collapsed ? 'md:px-2' : ''} px-3`}>
          {activeCrm.navGroups.map((group) => (
            <SidebarGroup
              key={group.groupLabel}
              group={group}
              collapsed={collapsed}
              onNavClick={closeDrawer}
            />
          ))}
        </nav>

        {/* Rodapé — toggle colapsar + perfil do utilizador */}
        <div className="shrink-0 border-t border-neutral-200 p-3">
          <button
            type="button"
            onClick={() => setCollapsed((v) => !v)}
            className={`mb-1.5 hidden w-full items-center gap-2.5 rounded-control px-2.5 py-2 text-[13px] font-medium text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-900 md:flex ${
              collapsed ? 'md:justify-center md:px-0' : ''
            }`}
            aria-label={collapsed ? 'Expandir menu' : 'Colapsar menu'}
            title={collapsed ? 'Expandir menu' : 'Colapsar menu'}
          >
            {collapsed ? (
              <PanelLeftOpen className="h-[18px] w-[18px] shrink-0" />
            ) : (
              <PanelLeftClose className="h-[18px] w-[18px] shrink-0" />
            )}
            <span className={collapsed ? 'md:hidden' : ''}>Colapsar</span>
          </button>

          <div
            className={`flex items-center gap-2.5 rounded-control px-1.5 py-1.5 ${
              collapsed ? 'md:justify-center md:px-0' : ''
            }`}
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-cruor-100 text-[12px] font-semibold text-cruor-700 ring-1 ring-cruor-200">
              {initials || 'U'}
            </div>
            <div className={`min-w-0 flex-1 ${collapsed ? 'md:hidden' : ''}`}>
              <p className="truncate text-[13px] font-semibold text-neutral-800">
                {session?.user.name ?? session?.user.email?.split('@')[0] ?? '—'}
              </p>
              <p className="truncate text-[11px] text-neutral-400">{session?.user.email ?? ''}</p>
            </div>
            <button
              type="button"
              onClick={() => void handleSignOut()}
              className={`shrink-0 rounded-control p-1.5 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-cruor-600 ${
                collapsed ? 'md:hidden' : ''
              }`}
              title="Sair"
              aria-label="Sair"
            >
              <LogOut size={14} />
            </button>
          </div>
        </div>
      </aside>

      {/* Área principal */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="z-10 flex h-16 shrink-0 items-center gap-4 border-b border-neutral-200 bg-white px-4 shadow-topbar md:px-6">
          <button
            type="button"
            className="shrink-0 rounded-control p-1.5 text-neutral-500 transition-colors hover:bg-neutral-100 md:hidden"
            onClick={() => setDrawerOpen(true)}
            aria-label="Abrir menu"
          >
            <Menu size={18} />
          </button>

          <div className="hidden min-w-0 shrink-0 md:flex">
            <Breadcrumb pathname={pathname} />
          </div>

          <div className="mx-auto flex w-full max-w-md flex-1 items-center gap-2 rounded-control border border-neutral-200 bg-neutral-50 px-3 py-2 transition-colors focus-within:border-cruor-300 focus-within:bg-white focus-within:ring-2 focus-within:ring-cruor-500/10">
            <Search className="h-3.5 w-3.5 shrink-0 text-neutral-400" />
            <input
              type="text"
              placeholder="Pesquisar…"
              className="flex-1 bg-transparent text-[13px] text-neutral-700 outline-none placeholder:text-neutral-400"
              readOnly
              onFocus={(e) => e.target.blur()}
            />
            <span className="shrink-0 rounded border border-neutral-200 bg-white px-1.5 py-0.5 font-mono text-[11px] text-neutral-400">
              ⌘K
            </span>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              className="relative rounded-full border border-neutral-200 bg-white p-2 text-neutral-500 transition-colors hover:bg-neutral-50 hover:text-neutral-800"
              aria-label="Notificações"
              onClick={() => console.info('[Cruor] Notificações — a implementar')}
            >
              <Bell size={16} />
              <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-cruor-600 ring-2 ring-white" />
            </button>
            <Button
              variant="dark"
              size="sm"
              onClick={() => console.info('[Cruor] Novo — a implementar')}
            >
              + Novo
            </Button>
          </div>
        </header>

        <main className="relative flex-1 overflow-y-auto p-5 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

interface CrmSwitcherProps {
  collapsed: boolean;
  onNavigate: () => void;
}

function CrmSwitcher({ collapsed, onNavigate }: CrmSwitcherProps) {
  const { activeCrm, crms, setCrm } = useCrm();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const handleSelect = (id: CrmId) => {
    const preset = crms.find((c) => c.id === id);
    if (!preset) return;
    setCrm(id);
    setOpen(false);
    onNavigate();
    const first = preset.navGroups[0]?.items[0]?.to ?? '/';
    void navigate({ to: first });
  };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`flex w-full items-center gap-2.5 rounded-control border border-neutral-200 bg-white px-2.5 py-2 text-left transition-colors hover:bg-neutral-50 ${
          collapsed ? 'md:justify-center md:px-0' : ''
        }`}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-[10px] font-bold text-white"
          style={{ backgroundColor: activeCrm.swatch }}
        >
          {activeCrm.chip}
        </span>
        <span className={`min-w-0 flex-1 ${collapsed ? 'md:hidden' : ''}`}>
          <span className="block truncate text-[13px] font-semibold text-neutral-900">
            {activeCrm.name}
          </span>
          <span className="block truncate text-[10px] text-neutral-400">{activeCrm.area}</span>
        </span>
        <ChevronsUpDown
          size={14}
          className={`shrink-0 text-neutral-400 ${collapsed ? 'md:hidden' : ''}`}
        />
      </button>

      {open && (
        <div
          className={`absolute z-50 w-[232px] overflow-hidden rounded-control border border-neutral-200 bg-white p-1 shadow-pop ${
            collapsed ? 'left-0 top-0 md:left-full md:ml-2' : 'left-0 right-0 mt-1.5'
          }`}
          role="listbox"
        >
          {crms.map((crm) => {
            const isActive = crm.id === activeCrm.id;
            return (
              <button
                key={crm.id}
                type="button"
                role="option"
                aria-selected={isActive}
                onClick={() => handleSelect(crm.id)}
                className={`flex w-full items-center gap-2.5 rounded-[7px] px-2 py-1.5 text-left transition-colors hover:bg-neutral-100 ${
                  isActive ? 'bg-neutral-100' : ''
                }`}
              >
                <span
                  className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md text-[9px] font-bold text-white"
                  style={{ backgroundColor: crm.swatch }}
                >
                  {crm.chip}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] font-medium text-neutral-900">
                    {crm.name}
                  </span>
                  <span className="block truncate text-[11px] text-neutral-400">{crm.area}</span>
                </span>
                {isActive && <Check size={14} className="shrink-0 text-cruor-600" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

interface SidebarGroupProps {
  group: NavGroup;
  collapsed: boolean;
  onNavClick: () => void;
}

function SidebarGroup({ group, collapsed, onNavClick }: SidebarGroupProps) {
  return (
    <div className="mb-4 last:mb-1">
      <p
        className={`mb-1 px-2.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-neutral-400 ${
          collapsed ? 'md:hidden' : ''
        }`}
      >
        {group.groupLabel}
      </p>
      <div className={`mx-2.5 mb-2 hidden h-px bg-neutral-200 ${collapsed ? 'md:block' : ''}`} />
      <ul className="space-y-0.5">
        {group.items.map((item) => (
          <SidebarItem key={item.to} item={item} collapsed={collapsed} onClick={onNavClick} />
        ))}
      </ul>
    </div>
  );
}

interface SidebarItemProps {
  item: NavItem;
  collapsed: boolean;
  onClick: () => void;
}

function SidebarItem({ item, collapsed, onClick }: SidebarItemProps) {
  const Icon = item.icon;
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const exactMatch = item.to === '/';
  const isActive = exactMatch
    ? pathname === '/'
    : pathname === item.to || pathname.startsWith(item.to + '/');

  return (
    <li className="group/item relative">
      <Link
        to={item.to}
        onClick={onClick}
        activeProps={{ className: 'bg-neutral-100 text-neutral-900 font-semibold' }}
        inactiveProps={{
          className: 'text-neutral-500 hover:bg-neutral-50 hover:text-neutral-900',
        }}
        className={`relative flex items-center gap-2.5 rounded-control px-2.5 py-2 text-[13px] font-medium transition-colors duration-150 ${
          collapsed ? 'md:justify-center' : ''
        }`}
        activeOptions={{ exact: exactMatch }}
      >
        <Icon
          className={`h-[18px] w-[18px] shrink-0 transition-colors ${
            isActive ? 'text-cruor-600' : 'text-neutral-400 group-hover/item:text-neutral-600'
          }`}
        />
        <span className={`flex-1 truncate ${collapsed ? 'md:hidden' : ''}`}>{item.label}</span>
        {item.mock === true && (
          <span
            className={`ml-auto rounded-full bg-neutral-100 px-1.5 py-0.5 text-[10px] font-medium text-neutral-400 group-hover/item:bg-neutral-200/70 ${
              collapsed ? 'md:hidden' : ''
            }`}
          >
            mock
          </span>
        )}
      </Link>

      {collapsed && (
        <span className="pointer-events-none absolute left-[calc(100%+10px)] top-1/2 z-50 hidden -translate-y-1/2 whitespace-nowrap rounded-control bg-ink-900 px-2.5 py-1.5 text-[12px] font-medium text-white opacity-0 shadow-pop transition-opacity duration-150 md:group-hover/item:block md:group-hover/item:opacity-100">
          {item.label}
          {item.mock === true && <span className="ml-1.5 text-neutral-400">· mock</span>}
        </span>
      )}
    </li>
  );
}
```

- [ ] **Step 2: Verificar que compila**

Run: `pnpm typecheck`
Expected: PASS. Confirma que os imports de `lib/crm` resolvem, que `NavGroup`/`NavItem` já não são definidos localmente, e que nenhum ícone lucide removido ficou em uso.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/routes/__root.tsx
git commit -m "feat(frontend): switcher de CRM funcional + nav do CRM ativo"
```

---

## Task 9: Verificação final — lint, build e browser

**Files:** nenhum (verificação).

- [ ] **Step 1: Lint**

Run: `pnpm lint`
Expected: PASS, sem erros nem warnings.

- [ ] **Step 2: Typecheck**

Run: `pnpm typecheck`
Expected: PASS.

- [ ] **Step 3: Reiniciar o dev server**

Alterações ao `tailwind.config.ts` só são apanhadas com reload do dev server. Garantir que o `frontend` (e o `backend` em `localhost:3001`) estão a correr; reiniciar o `pnpm dev` do `frontend` se já estava aberto desde antes da Task 3.

- [ ] **Step 4: Verificação manual no browser**

Abrir `http://localhost:5173` (com sessão iniciada) e confirmar:

- O switcher mostra "Cruor Flora" e abre o dropdown com os 4 CRMs (ponto de cor + nome + área; o ativo com check).
- Trocar para **Forge** → acento muda para teal, neutros ficam slate, a nav passa a ter os tópicos de software, e navega para `/m/dashboard`.
- Trocar para **Pulse** e **Studio** → acento (magenta / violeta) e neutros mudam coerentemente; nav respetiva.
- Voltar a **Flora** → acento azul, nav original, navega para `/` (dashboard real funciona).
- Reload da página → o CRM ativo persiste; **sem flash** de tema azul antes do tema guardado.
- Itens de nav dos CRMs de exemplo → abrem `/m/<slug>` com o título e ícone corretos do tópico.
- Colapsar a sidebar → o switcher mostra só o chip colorido; o dropdown abre à direita do rail.
- Dropdown fecha com clique fora e com `Esc`.

- [ ] **Step 5: Commit (se a verificação manual exigiu correções)**

Se algum passo manual revelou um problema, corrigir e commitar:

```bash
git add -A
git commit -m "fix(frontend): correções da verificação do multi-CRM switcher"
```

Se não houve correções, não há commit nesta tarefa.

---

## Notas de implementação

- **Ordem das tarefas:** cada tarefa deixa a app num estado funcional. Tasks 1–2 e 4–5 criam ficheiros ainda não importados (typecheck valida-os isoladamente). Task 3 mantém a app a renderizar via os defaults do `:root`. Task 6 liga o provider sem mexer no shell. Task 8 ativa a feature completa.
- **Sem test runner no frontend:** a verificação é `typecheck` + `lint` + browser, como na spec §8. Não inventar `vitest`/`jest`.
- **`tsr generate`:** corre automaticamente dentro de `pnpm typecheck`. O `routeTree.gen.ts` regenerado deve ser commitado junto com a rota nova (Task 7).
- **Restart do dev server:** mudanças ao `tailwind.config.ts` exigem reload do Vite — relevante para a verificação manual da Task 9, não para o `typecheck`.
