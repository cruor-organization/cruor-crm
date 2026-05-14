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
  return CRMS.find((c) => c.id === id) ?? (CRMS[0] as CrmPreset);
}
