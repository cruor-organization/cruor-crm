import type { QueryClient } from '@tanstack/react-query';
import { Link, Outlet, createRootRouteWithContext, useRouterState } from '@tanstack/react-router';
import {
  BarChart3,
  Bot,
  Boxes,
  ChevronRight,
  FileText,
  Globe,
  Home,
  Inbox,
  LayoutDashboard,
  LogOut,
  Mail,
  MapPin,
  Megaphone,
  Menu,
  Package,
  Route as RouteIcon,
  Search,
  Settings,
  Share2,
  ShoppingCart,
  Tag,
  TrendingUp,
  Truck,
  Undo2,
  UserPlus,
  Users,
  Video,
  Wallet,
  X,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/Button';
import { signOut, useSession } from '@/lib/auth-client';

export interface RouterContext {
  queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootLayout,
});

interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  mock?: boolean;
}

interface NavGroup {
  groupLabel: string;
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
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

// Mapeamento de segmentos de rota para labels pt-PT
const ROUTE_LABELS: Record<string, string> = {
  '': 'Dashboard',
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
  // Segmentos dinâmicos (IDs) — capitaliza e abrevia
  if (segment.length > 12) return segment.slice(0, 8) + '…';
  return segment.charAt(0).toUpperCase() + segment.slice(1);
}

function Breadcrumb({ pathname }: { pathname: string }) {
  // Remove trailing slash e divide em segmentos
  const segments = pathname.replace(/\/$/, '').split('/').filter(Boolean);

  if (segments.length === 0) {
    return (
      <div className="flex items-center gap-1.5 text-[13px]">
        <Home className="h-3.5 w-3.5 text-neutral-400" />
        <span className="font-medium text-neutral-900">Dashboard</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1 text-[13px]">
      <Link
        to="/"
        className="flex items-center text-neutral-400 hover:text-neutral-600 transition-colors"
      >
        <Home className="h-3.5 w-3.5" />
      </Link>
      {segments.map((segment, idx) => {
        const isLast = idx === segments.length - 1;
        return (
          <span key={idx} className="flex items-center gap-1">
            <ChevronRight className="h-3.5 w-3.5 text-neutral-300" />
            {isLast ? (
              <span className="font-medium text-neutral-900">{humanizeSegment(segment)}</span>
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

function AppShell() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { data: session } = useSession();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const handleSignOut = async () => {
    await signOut();
    window.location.href = '/sign-in';
  };

  // Iniciais do utilizador para o avatar
  const userName = session?.user.name ?? session?.user.email ?? 'U';
  const initials = userName
    .split(/[\s@]+/)
    .slice(0, 2)
    .map((part: string) => part[0]?.toUpperCase() ?? '')
    .join('');

  return (
    <div className="flex h-screen overflow-hidden bg-neutral-50">
      {/* Mobile overlay */}
      {drawerOpen && (
        <div
          className="fixed inset-0 z-20 bg-neutral-950/40 backdrop-blur-[2px] md:hidden"
          onClick={() => setDrawerOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-30 flex w-[264px] flex-col border-r border-neutral-200 bg-gradient-to-b from-white to-neutral-50/60 transition-transform duration-200 md:static md:translate-x-0 ${drawerOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        {/* Logo lockup */}
        <div className="flex h-16 items-center justify-between border-b border-neutral-200 px-4">
          <Link to="/" className="flex items-center gap-3" onClick={() => setDrawerOpen(false)}>
            <img src="/cruor_logo_light.png" alt="Cruor" className="h-7 w-auto object-contain" />
            <span className="text-[11px] text-neutral-400 leading-tight">CRM Florista B2B</span>
          </Link>
          <button
            type="button"
            className="rounded-control p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600 md:hidden transition-colors"
            onClick={() => setDrawerOpen(false)}
            aria-label="Fechar menu"
          >
            <X size={16} />
          </button>
        </div>

        {/* Nav groups — scrollable */}
        <nav className="flex-1 overflow-y-auto px-2 py-3">
          {NAV_GROUPS.map((group) => (
            <SidebarGroup
              key={group.groupLabel}
              group={group}
              onNavClick={() => setDrawerOpen(false)}
            />
          ))}
        </nav>

        {/* Perfil do utilizador — fixo no fundo */}
        <div className="border-t border-neutral-200 p-3">
          <div className="flex items-center gap-2.5 rounded-control px-2 py-2">
            {/* Avatar com iniciais */}
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-cruor-100 text-[12px] font-semibold text-cruor-700">
              {initials || 'U'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-medium text-neutral-800">
                {session?.user.name ?? session?.user.email?.split('@')[0] ?? '—'}
              </p>
              <p className="truncate text-[11px] text-neutral-500">{session?.user.email ?? ''}</p>
            </div>
            <button
              type="button"
              onClick={() => void handleSignOut()}
              className="shrink-0 rounded-control p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 transition-colors"
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
        {/* Topbar */}
        <header className="flex h-16 items-center gap-4 border-b border-neutral-200 bg-white px-4 md:px-6">
          {/* Mobile: botão hambúrguer (extrema esquerda) */}
          <button
            type="button"
            className="shrink-0 rounded-control p-1.5 text-neutral-500 hover:bg-neutral-100 transition-colors md:hidden"
            onClick={() => setDrawerOpen(true)}
            aria-label="Abrir menu"
          >
            <Menu size={18} />
          </button>

          {/* Esquerda — breadcrumb */}
          <div className="hidden min-w-0 shrink-0 md:flex">
            <Breadcrumb pathname={pathname} />
          </div>

          {/* Centro — pesquisa global */}
          <div className="mx-auto flex w-full max-w-md flex-1 items-center gap-2 rounded-control border border-neutral-200 bg-neutral-50 px-3 py-1.5 transition-colors focus-within:border-neutral-300 focus-within:bg-white">
            <Search className="h-3.5 w-3.5 shrink-0 text-neutral-400" />
            <input
              type="text"
              placeholder="Pesquisar…"
              className="flex-1 bg-transparent text-[13px] text-neutral-700 placeholder:text-neutral-400 outline-none"
              readOnly
              onFocus={(e) => e.target.blur()}
            />
            <span className="shrink-0 rounded border border-neutral-200 bg-white px-1.5 py-0.5 font-mono text-[11px] text-neutral-400">
              ⌘K
            </span>
          </div>

          {/* Direita — CTA primário */}
          <div className="shrink-0">
            <Button
              variant="dark"
              size="sm"
              onClick={() => console.info('[Cruor] Novo — a implementar')}
            >
              + Novo
            </Button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-5 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

interface SidebarGroupProps {
  group: NavGroup;
  onNavClick: () => void;
}

function SidebarGroup({ group, onNavClick }: SidebarGroupProps) {
  return (
    <div className="mb-4">
      <p className="mb-1 px-3 text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
        {group.groupLabel}
      </p>
      <ul className="space-y-0.5">
        {group.items.map((item) => (
          <SidebarItem key={item.to} item={item} onClick={onNavClick} />
        ))}
      </ul>
    </div>
  );
}

interface SidebarItemProps {
  item: NavItem;
  onClick: () => void;
}

function SidebarItem({ item, onClick }: SidebarItemProps) {
  const Icon = item.icon;
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const exactMatch = item.to === '/';
  const isActive = exactMatch
    ? pathname === '/'
    : pathname === item.to || pathname.startsWith(item.to + '/');

  return (
    <li>
      <Link
        to={item.to}
        onClick={onClick}
        activeProps={{
          className:
            'bg-neutral-100 text-neutral-900 font-semibold before:absolute before:left-0 before:top-1 before:bottom-1 before:w-0.5 before:rounded-full before:bg-cruor-600',
        }}
        inactiveProps={{
          className: 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900',
        }}
        className="relative flex items-center gap-2.5 rounded-control px-2.5 py-1.5 text-[13px] font-medium transition-colors duration-150"
        activeOptions={{ exact: exactMatch }}
      >
        <Icon
          className={`h-4 w-4 shrink-0 transition-colors ${isActive ? 'text-cruor-600' : 'text-neutral-400'}`}
        />
        <span className="flex-1 truncate">{item.label}</span>
        {item.mock === true && (
          <span className="ml-auto rounded-full bg-neutral-100 px-1.5 py-0.5 text-[10px] font-medium text-neutral-500">
            mock
          </span>
        )}
      </Link>
    </li>
  );
}
