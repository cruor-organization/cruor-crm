import type { QueryClient } from '@tanstack/react-query';
import { Link, Outlet, createRootRouteWithContext, useRouterState } from '@tanstack/react-router';

export interface RouterContext {
  queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootLayout,
});

const NAV = [
  { to: '/', label: 'Dashboard' },
  { to: '/customers', label: 'Floristas' },
  { to: '/leads', label: 'Potenciais' },
  { to: '/suppliers', label: 'Fornecedores' },
  { to: '/products', label: 'Produtos' },
] as const;

function RootLayout() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const isAuthRoute = path.startsWith('/sign-');

  if (isAuthRoute) return <Outlet />;

  return (
    <div className="min-h-screen bg-neutral-50">
      <nav className="border-b bg-white">
        <div className="mx-auto flex max-w-7xl items-center gap-1 px-4 py-3">
          <span className="mr-6 text-sm font-semibold text-neutral-900">CRM Florista B2B</span>
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              activeProps={{ className: 'bg-neutral-900 text-white' }}
              inactiveProps={{ className: 'text-neutral-700 hover:bg-neutral-100' }}
              className="rounded-md px-3 py-1.5 text-sm font-medium transition-colors"
            >
              {item.label}
            </Link>
          ))}
        </div>
      </nav>
      <main className="mx-auto max-w-7xl p-6">
        <Outlet />
      </main>
    </div>
  );
}
