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
      <span className="absolute h-1.5 w-7 -rotate-[28deg] rounded-full border border-cruor-400 shadow-[0_0_10px_rgb(var(--cruor-600)_/_0.55)]" />
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
