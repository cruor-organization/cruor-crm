# Multi-CRM Switcher — Design Spec

**Data:** 2026-05-14
**Estado:** Aprovado, pronto para implementação
**Próximo passo:** Plano de implementação detalhado via `writing-plans` skill

---

## 1. Contexto

O frontend (`frontend/`, React 18 + TanStack Router + Tailwind 3) tem hoje um único
CRM — o **Florista B2B** — com:

- Cores fixas no `tailwind.config.ts` (escalas `cruor`, `neutral`, e semânticas).
- `NAV_GROUPS` hardcoded como constante em `src/routes/__root.tsx`.
- Um "switcher de organização" no topo da sidebar que é apenas um botão estático
  (`console.info` no clique).
- Sem infra de theming, sem context providers além de `QueryClientProvider` e
  `RouterProvider`. Dados são todos mock (`lib/mock-api.ts`, `lib/mock-data/`).

O design visual atual (tema claro, acento azul, cards brancos sobre canvas
cinza-frio) foi estabelecido na sessão de 2026-05-14, por engenharia reversa de
uma referência SaaS.

## 2. Objetivo

A empresa-mãe **Cruor** opera vários CRMs em áreas de negócio distintas. Tornar o
switcher funcional: alternar entre 4 CRMs, cada um com a sua identidade de cor e o
seu conjunto de tópicos de navegação. As funcionalidades específicas da florista
que não se aplicam a outra área simplesmente não aparecem no nav desse CRM.

## 3. Scope

### Dentro

1. **Theming em runtime** — escalas `cruor` (acento) e `neutral` (estrutura)
   passam a ser dirigidas por CSS variables; cada CRM tem o seu conjunto de
   valores.
2. **4 presets de CRM** — Flora (existente), Forge, Pulse, Studio — cada um com
   nome, área, cor de acento, temperatura de neutros e config de nav própria.
3. **`CrmProvider`** — context React com o CRM ativo, persistência em
   `localStorage`, e aplicação do tema no `<html>`.
4. **Switcher dropdown** — substitui o botão estático; lista os 4 CRMs, troca o
   ativo, re-tematiza a app na hora.
5. **Rota placeholder `/m/$slug`** — página "módulo de exemplo" para os itens de
   nav dos 3 CRMs de exemplo.
6. **Refactor de `__root.tsx`** — `NAV_GROUPS` deixa de ser constante e passa a
   vir do CRM ativo; tipos `NavGroup`/`NavItem` movem-se para `lib/crm/types.ts`.

### Fora

| Item                                           | Razão                                                                     | Quando            |
| ---------------------------------------------- | ------------------------------------------------------------------------- | ----------------- |
| Multi-tenancy real (backend, `organizationId`) | Pedido explícito: "só o shell — tema + nav"                               | Eventual, à parte |
| Dados mock próprios por CRM                    | Fora do âmbito acordado; dados continuam os da florista                   | Eventual          |
| Páginas reais para os tópicos dos CRMs exemplo | "algumas funcionalidades já não são necessárias" — placeholder chega      | Eventual          |
| Theming das cores semânticas (`green`/`red`/…) | Sucesso/erro são universais — não mudam por CRM                           | —                 |
| Modo escuro por CRM                            | Utilizador escolheu "acento + temperatura dos neutros", não tema completo | —                 |
| Tradução/i18n dos tópicos                      | App é pt-PT only                                                          | —                 |

### Dívida assumida

- Os 3 CRMs de exemplo partilham as rotas placeholder e os dados mock da florista
  nas páginas que ainda existam — é um protótipo do conceito, não produto final.

## 4. Arquitetura

### 4.1 Mecanismo de theming (Abordagem A — aprovada)

As escalas `cruor` e `neutral` no `tailwind.config.ts` passam de valores hex
fixos para referências a CSS variables, no padrão Tailwind com `<alpha-value>`:

```ts
// tailwind.config.ts
cruor: {
  50:  'rgb(var(--cruor-50) / <alpha-value>)',
  // … 100 … 950
},
neutral: {
  50:  'rgb(var(--neutral-50) / <alpha-value>)',
  // … 100 … 950
},
```

As variáveis são **triplos RGB separados por espaço** (ex. `53 104 224`), exigido
pela sintaxe `<alpha-value>`. As cores semânticas (`green`, `amber`, `blue`,
`red`) e a escala `ink` (navy dos botões `dark`) **mantêm-se fixas**.

`globals.css` define o `:root` com os valores por omissão (= tema Flora), para a
app renderizar coerente mesmo antes do init JS.

### 4.2 Fluxo de dados

```
main.tsx
  └─ initCrmTheme()        ← corre ANTES de createRoot; lê localStorage,
  │                          aplica vars + data-crm no <html> (sem flash)
  └─ <CrmProvider>         ← context: { activeCrm, crms, setCrm }
       └─ <RouterProvider>
            └─ __root.tsx
                 ├─ useCrm() → switcher (nome/área/cor) + NAV_GROUPS
                 └─ rotas
```

`setCrm(id)` (no `CrmProvider`):

1. valida o id; atualiza o state do context;
2. `localStorage.setItem('cruor:active-crm', id)`;
3. `applyCrmTheme(preset)` — escreve as ~22 vars + `data-crm` no
   `document.documentElement`.

`setCrm` **não navega** — o `CrmProvider` vive fora do `RouterProvider` e não tem
acesso a `useNavigate`. A navegação é feita pelo componente switcher (dentro do
router): após `setCrm(id)`, chama `navigate({ to })` para o primeiro item de nav
do CRM (`/` na Flora, `/m/dashboard` nos outros).

### 4.3 Ficheiros

**Novos — `frontend/src/lib/crm/`:**

| Ficheiro          | Responsabilidade                                                                |
| ----------------- | ------------------------------------------------------------------------------- |
| `types.ts`        | `CrmId`, `Shade`, `CrmPreset`, `NavGroup`, `NavItem`                            |
| `presets.ts`      | Os 4 objetos `CrmPreset` + `CRMS` array + `getCrmPreset(id)` + `DEFAULT_CRM_ID` |
| `theme.ts`        | `applyCrmTheme(preset)`, `initCrmTheme()`, `CRM_STORAGE_KEY`                    |
| `CrmProvider.tsx` | `CrmProvider`, `useCrm()` hook                                                  |

**Novo — rota:**

| Ficheiro                 | Responsabilidade                                   |
| ------------------------ | -------------------------------------------------- |
| `src/routes/m.$slug.tsx` | Página placeholder "módulo de exemplo", tematizada |

**Alterados:**

| Ficheiro                 | Mudança                                                                   |
| ------------------------ | ------------------------------------------------------------------------- |
| `tailwind.config.ts`     | `cruor` + `neutral` → `rgb(var(--…) / <alpha-value>)`                     |
| `src/styles/globals.css` | `:root` com as vars por omissão (tema Flora)                              |
| `src/main.tsx`           | `initCrmTheme()` antes do `createRoot`; `<CrmProvider>` a embrulhar a app |
| `src/routes/__root.tsx`  | switcher consome `useCrm()`; `NAV_GROUPS` vem do CRM ativo; tipos movidos |

### 4.4 Modelo de dados

```ts
type CrmId = 'florista' | 'forge' | 'pulse' | 'studio';
type Shade = 50 | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900 | 950;

interface NavItem {
  to: string; // '/customers' (Flora) ou '/m/projetos' (exemplo)
  label: string;
  icon: LucideIcon;
}
interface NavGroup {
  groupLabel: string;
  items: NavItem[];
}

interface CrmPreset {
  id: CrmId;
  name: string; // título no switcher  — ex. 'Cruor Forge'
  area: string; // subtítulo           — ex. 'Software à medida'
  chip: string; // 1–2 chars no chip colorido do switcher
  swatch: string; // hex do acento, para o ponto de cor no dropdown
  colors: {
    cruor: Record<Shade, string>; // triplos RGB: '53 104 224'
    neutral: Record<Shade, string>;
  };
  navGroups: NavGroup[];
}
```

## 5. Os 4 CRMs

A marca **"Cruor" + RingMark** no topo da sidebar mantém-se sempre (empresa-mãe).
A estrutura — tema claro, cards brancos, tipografia, sombras, raios — é idêntica
nos 4. Só mudam: **acento**, **temperatura dos neutros**, **tópicos de nav**.

### 5.1 Resumo

| CRM              | Área                  | Acento (600)           | Neutros             |
| ---------------- | --------------------- | ---------------------- | ------------------- |
| **Cruor Flora**  | Florista B2B          | Azul `#3568E0`         | Cinza frio          |
| **Cruor Forge**  | Software à medida     | Teal `#0E8C7C`         | Slate (mais frio)   |
| **Cruor Pulse**  | Marketing p/ empresas | Magenta-rosa `#C02C5E` | Cinza leve quente   |
| **Cruor Studio** | Design 3D de figuras  | Violeta `#7233D6`      | Cinza quente (clay) |

### 5.2 Escalas de acento (`cruor`) — triplos RGB

| Shade | Flora (azul) | Forge (teal) | Pulse (magenta) | Studio (violeta) |
| ----- | ------------ | ------------ | --------------- | ---------------- |
| 50    | 239 244 254  | 236 251 248  | 253 238 243     | 244 239 254      |
| 100   | 220 231 253  | 205 243 236  | 250 216 227     | 232 222 252      |
| 200   | 191 210 251  | 157 230 217  | 244 178 200     | 210 191 249      |
| 300   | 149 180 247  | 100 208 191  | 236 133 166     | 182 151 244      |
| 400   | 104 142 241  | 50 181 162   | 226 89 133      | 153 107 236      |
| 500   | 71 111 232   | 25 156 138   | 211 58 109      | 130 73 228       |
| 600   | 53 104 224   | 14 140 124   | 192 44 94       | 114 51 214       |
| 700   | 42 79 192    | 12 112 101   | 159 36 78       | 95 40 180        |
| 800   | 39 66 155    | 14 90 82     | 131 32 66       | 79 35 147        |
| 900   | 37 60 123    | 16 74 68     | 110 30 58       | 66 30 120        |
| 950   | 26 38 75     | 4 43 40      | 64 12 31        | 42 17 80         |

### 5.3 Escalas de neutros (`neutral`) — triplos RGB

| Shade | Flora (frio) | Forge (slate) | Pulse (leve quente) | Studio (clay) |
| ----- | ------------ | ------------- | ------------------- | ------------- |
| 50    | 248 249 250  | 247 249 251   | 250 249 248         | 250 248 245   |
| 100   | 238 240 242  | 236 239 243   | 241 240 238         | 241 238 233   |
| 200   | 227 229 233  | 224 228 234   | 231 229 226         | 231 226 218   |
| 300   | 208 211 217  | 205 210 219   | 214 211 207         | 214 207 195   |
| 400   | 165 170 179  | 161 168 181   | 171 168 162         | 171 162 146   |
| 500   | 124 130 140  | 119 127 142   | 131 127 121         | 131 122 107   |
| 600   | 90 96 107    | 85 93 109     | 97 93 87            | 97 90 78      |
| 700   | 63 68 78     | 59 66 80      | 69 66 61            | 69 63 55      |
| 800   | 39 43 51     | 36 40 51      | 44 42 39            | 44 40 35      |
| 900   | 23 26 31     | 21 24 31      | 26 25 23            | 26 23 20      |
| 950   | 13 15 18     | 12 14 18      | 16 15 13            | 16 14 12      |

A rampa de luminosidade é equivalente nos 4 — só varia a temperatura do tom —
para o contraste e a legibilidade se manterem constantes.

### 5.4 Configuração de nav

`icon` indica o ícone lucide-react pretendido; os nomes exatos são verificados
contra `lucide-react` na implementação (o `typecheck` apanha exports inexistentes).

**Cruor Flora** — mantém o `NAV_GROUPS` atual sem alteração (Visão Geral,
Comercial, Catálogo, Encomendas, Operações, IA & Conteúdo, Marketing, Reports,
Definições). Os `to` continuam a apontar para as rotas reais existentes.

**Cruor Forge** — `to` de todos os itens = `/m/<slug>`:

| Grupo       | Itens (label · slug · icon)                                                                                                                       |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Visão Geral | Dashboard · `dashboard` · LayoutDashboard                                                                                                         |
| Comercial   | Clientes · `clientes` · Users · / Leads · `leads` · UserPlus · / Propostas · `propostas` · FileText · / Contratos · `contratos` · FileSignature   |
| Entrega     | Projetos · `projetos` · Briefcase · / Sprints · `sprints` · Flag · / Tarefas · `tarefas` · ListChecks · / Time tracking · `time-tracking` · Timer |
| Equipa      | Membros · `membros` · Contact · / Capacidade · `capacidade` · Gauge                                                                               |
| Financeiro  | Faturação · `faturacao` · Receipt · / Relatórios · `relatorios` · BarChart3                                                                       |
| Definições  | Organização · `definicoes` · Settings                                                                                                             |

**Cruor Pulse** — `to` de todos os itens = `/m/<slug>`:

| Grupo       | Itens (label · slug · icon)                                                                                                 |
| ----------- | --------------------------------------------------------------------------------------------------------------------------- |
| Visão Geral | Dashboard · `dashboard` · LayoutDashboard                                                                                   |
| Comercial   | Clientes · `clientes` · Users · / Leads · `leads` · UserPlus · / Orçamentos · `orcamentos` · FileText                       |
| Campanhas   | Campanhas · `campanhas` · Megaphone · / Calendário de conteúdo · `calendario` · Calendar · / Anúncios · `anuncios` · Target |
| Conteúdo    | Redes sociais · `redes-sociais` · Share2 · / Email marketing · `email` · Mail · / Criativos & Assets · `criativos` · Image  |
| Análise     | Analytics · `analytics` · TrendingUp · / Relatórios · `relatorios` · BarChart3                                              |
| Definições  | Organização · `definicoes` · Settings                                                                                       |

**Cruor Studio** — `to` de todos os itens = `/m/<slug>`:

| Grupo       | Itens (label · slug · icon)                                                                                                          |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| Visão Geral | Dashboard · `dashboard` · LayoutDashboard                                                                                            |
| Comercial   | Clientes · `clientes` · Users · / Encomendas · `encomendas` · ShoppingCart · / Orçamentos · `orcamentos` · FileText                  |
| Catálogo    | Modelos & Peças · `modelos` · Boxes · / Galeria · `galeria` · Image · / Ficheiros 3D · `ficheiros-3d` · Layers                       |
| Produção    | Fila de impressão · `impressao` · Printer · / Materiais · `materiais` · Palette · / Acabamento & Pintura · `acabamento` · Paintbrush |
| Financeiro  | Faturação · `faturacao` · Receipt · / Relatórios · `relatorios` · BarChart3                                                          |
| Definições  | Organização · `definicoes` · Settings                                                                                                |

## 6. Componentes

### 6.1 `CrmProvider` / `useCrm()`

- State: `activeCrmId` (inicializado a partir do `localStorage`, fallback
  `DEFAULT_CRM_ID = 'florista'`).
- Expõe `{ activeCrm: CrmPreset, crms: CrmPreset[], setCrm(id: CrmId) }`.
- `setCrm` faz a sequência da §4.2 (state + persistência + tema). Não navega.
- Não re-aplica o tema em cada render — só no `setCrm`; o init pré-paint já
  cobriu o primeiro load.

### 6.2 Switcher (dentro de `__root.tsx`)

- O botão atual (chip + nome + `ChevronsUpDown`) passa a abrir um dropdown.
- Dropdown: painel `absolute` por baixo do botão, uma linha por CRM —
  ponto de cor (`swatch`) + nome + área; o ativo com `Check`.
- Fecha com clique fora (listener no `document`) ou `Esc`.
- Sidebar colapsada: o painel abre à direita do rail (`left-full`), alinhado ao
  topo do botão.
- Clicar numa linha → `setCrm(id)`, depois `navigate({ to })` para o primeiro
  item de nav do CRM, e fecha o dropdown.

### 6.3 Rota `/m/$slug`

- `createFileRoute('/m/$slug')` com o mesmo `beforeLoad` de auth das rotas da
  florista (redirect a `/sign-in` sem sessão).
- O componente lê `slug`, e via `useCrm()` procura nos `navGroups` do CRM ativo o
  item cujo `to === '/m/' + slug`; mostra `label` + `groupLabel`.
- Fallback se não encontrar: humaniza o slug (capitaliza, troca `-` por espaço).
- Layout: `EmptyState`-like centrado — ícone do item, título do tópico, e uma
  linha a indicar que é um módulo de exemplo do CRM `{activeCrm.name}`.

## 7. Tratamento de erros

- **Id de CRM inválido no `localStorage`** — `initCrmTheme()` e o `CrmProvider`
  caem para `DEFAULT_CRM_ID` e reescrevem a chave.
- **`applyCrmTheme`** — apenas escritas em `document.documentElement.style` e
  `dataset`; sem modo de falha realista. Guard `typeof document !== 'undefined'`
  por segurança.
- **`/m/$slug` com slug desconhecido** — degrada para o slug humanizado, sem
  erro.

## 8. Verificação

O `frontend` não tem test runner (sem script `test` no `package.json`).
Verificação:

1. `pnpm typecheck` — apanha ícones lucide inexistentes, tipos de preset, etc.
2. `pnpm lint`.
3. **Manual no browser** (backend + frontend a correr):
   - Trocar entre os 4 CRMs → acento, neutros e nav mudam coerentemente.
   - Reload → o CRM ativo persiste; sem flash de tema no load.
   - Sidebar colapsada e expandida → switcher e dropdown funcionam em ambos.
   - CRMs de exemplo → itens de nav abrem `/m/<slug>` com o tópico correto.
   - Cruor Flora → rotas reais continuam a funcionar (dashboard, customers, …).

## 9. Sequência de implementação (esboço)

1. `lib/crm/types.ts` + `lib/crm/presets.ts` (dados puros, sem dependências de UI).
2. `tailwind.config.ts` + `globals.css` → escalas via CSS vars.
3. `lib/crm/theme.ts` (`applyCrmTheme`, `initCrmTheme`).
4. `lib/crm/CrmProvider.tsx`.
5. `main.tsx` → init + provider.
6. `routes/m.$slug.tsx`.
7. `__root.tsx` → tipos movidos, `NAV_GROUPS` do CRM ativo, switcher dropdown.
8. `pnpm typecheck` + `pnpm lint` + verificação manual no browser.

O detalhe fino (passos atómicos, ordem de commits) fica para o plano de
implementação via `writing-plans`.
