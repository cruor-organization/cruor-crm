import { useQuery } from '@tanstack/react-query';
import { createFileRoute, redirect, Link } from '@tanstack/react-router';

import { Button } from '@/components/ui/Button';
import { api } from '@/lib/api';
import { authClient } from '@/lib/auth-client';

interface Customer {
  id: string;
  legalName: string;
  tradingName: string | null;
  businessType: string;
  pricingTier: string;
  status: string;
  taxId: string | null;
  createdAt: string;
}

interface CustomerList {
  items: Customer[];
  total: number;
}

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: 'bg-green-100 text-green-800',
  PROSPECT: 'bg-blue-100 text-blue-800',
  AT_RISK: 'bg-amber-100 text-amber-800',
  CHURNED: 'bg-neutral-200 text-neutral-700',
  BLOCKED: 'bg-red-100 text-red-800',
};

export const Route = createFileRoute('/customers')({
  component: CustomersPage,
  beforeLoad: async () => {
    const { data } = await authClient.getSession();
    if (!data) throw redirect({ to: '/sign-in' });
  },
});

function CustomersPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['customers'],
    queryFn: () => api.get<CustomerList>('/api/customers'),
  });

  return (
    <section>
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Floristas-Clientes</h1>
          <p className="text-sm text-neutral-500">
            {data ? `${data.total} registos` : 'A carregar…'}
          </p>
        </div>
        <Link to="/customers/new">
          <Button>Novo florista</Button>
        </Link>
      </header>

      {isLoading && <div className="text-neutral-500">A carregar…</div>}
      {error && <div className="text-red-600">Erro: {error.message}</div>}

      {data?.items.length === 0 && (
        <div className="rounded-md border border-dashed bg-white p-12 text-center text-neutral-500">
          Sem floristas registados ainda. Converte um lead em <strong>Potenciais</strong>.
        </div>
      )}

      {data && data.items.length > 0 && (
        <div className="overflow-hidden rounded-md border bg-white">
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 text-left text-xs uppercase tracking-wide text-neutral-500">
              <tr>
                <th className="px-4 py-2">Razão social</th>
                <th className="px-4 py-2">Nome comercial</th>
                <th className="px-4 py-2">NIF</th>
                <th className="px-4 py-2">Tipo</th>
                <th className="px-4 py-2">Escalão</th>
                <th className="px-4 py-2">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {data.items.map((c) => (
                <tr key={c.id} className="cursor-pointer hover:bg-neutral-50">
                  <td className="px-4 py-2 font-medium">
                    <Link
                      to="/customers/$id"
                      params={{ id: c.id }}
                      className="hover:text-emerald-700 hover:underline"
                    >
                      {c.legalName}
                    </Link>
                  </td>
                  <td className="px-4 py-2 text-neutral-600">{c.tradingName ?? '—'}</td>
                  <td className="px-4 py-2 font-mono text-xs">{c.taxId ?? '—'}</td>
                  <td className="px-4 py-2">{c.businessType}</td>
                  <td className="px-4 py-2">{c.pricingTier}</td>
                  <td className="px-4 py-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        STATUS_COLORS[c.status] ?? ''
                      }`}
                    >
                      {c.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
