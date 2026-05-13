import type { QueryClient } from '@tanstack/react-query';
import { Link, Outlet, createRootRouteWithContext, useRouterState } from '@tanstack/react-router';
import {
  BarChart3,
  Bot,
  Boxes,
  FileText,
  Globe,
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

function RootLayout() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const isAuthRoute = path.startsWith('/sign-');

  if (isAuthRoute) return <Outlet />;

  return <AppShell />;
}

function AppShell() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { data: session } = useSession();

  const handleSignOut = async () => {
    await signOut();
    window.location.href = '/sign-in';
  };

  return (
    <div className="flex h-screen overflow-hidden bg-neutral-50">
      {/* Mobile overlay */}
      {drawerOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/40 md:hidden"
          onClick={() => setDrawerOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-30 flex w-64 flex-col border-r border-neutral-200 bg-white transition-transform duration-200 md:static md:translate-x-0 ${drawerOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        {/* Logo */}
        <div className="flex h-14 items-center justify-between border-b border-neutral-200 px-4">
          <Link to="/" className="flex items-center gap-2" onClick={() => setDrawerOpen(false)}>
            <span className="text-sm font-bold tracking-tight text-neutral-900">CRM Florista</span>
            <span className="rounded bg-emerald-600 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
              B2B
            </span>
          </Link>
          <button
            type="button"
            className="rounded p-1 text-neutral-500 hover:bg-neutral-100 md:hidden"
            onClick={() => setDrawerOpen(false)}
            aria-label="Fechar menu"
          >
            <X size={18} />
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

        {/* User menu at bottom */}
        <div className="border-t border-neutral-200 p-3">
          <div className="mb-1 px-2">
            <p className="truncate text-xs font-medium text-neutral-700">
              {session?.user.email ?? '—'}
            </p>
            <p className="text-[11px] text-neutral-400">{session?.user.name ?? ''}</p>
          </div>
          <button
            type="button"
            onClick={() => void handleSignOut()}
            className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900"
          >
            <LogOut size={15} />
            Sair
          </button>
        </div>
      </aside>

      {/* Main content area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Topbar */}
        <header className="flex h-14 items-center border-b border-neutral-200 bg-white px-4 md:px-6">
          <button
            type="button"
            className="mr-3 rounded p-1.5 text-neutral-500 hover:bg-neutral-100 md:hidden"
            onClick={() => setDrawerOpen(true)}
            aria-label="Abrir menu"
          >
            <Menu size={20} />
          </button>
          <div className="flex-1" />
        </header>

        <main className="flex-1 overflow-y-auto p-5 md:p-6">
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
      <p className="mb-1 px-2 text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
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

  return (
    <li>
      <Link
        to={item.to}
        onClick={onClick}
        activeProps={{
          className: 'bg-emerald-600 text-white hover:bg-emerald-700',
        }}
        inactiveProps={{
          className: 'text-neutral-700 hover:bg-neutral-100',
        }}
        className="flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm font-medium transition-colors"
        activeOptions={{ exact: item.to === '/' }}
      >
        <Icon size={16} className="shrink-0" />
        <span className="flex-1 truncate">{item.label}</span>
        {item.mock === true && (
          <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-600">
            mock
          </span>
        )}
      </Link>
    </li>
  );
}
