import { useQuery } from '@tanstack/react-query';
import { createFileRoute, redirect } from '@tanstack/react-router';

import { api } from '@/lib/api';
import { authClient } from '@/lib/auth-client';

interface Product {
  id: string;
  sku: string;
  name: string;
  category: string;
  decision: string;
  status: string;
  costEur: string;
  recommendedRetailEur: string | null;
  score: string | null;
  visualScore: string | null;
  isAnchor: boolean;
  seasonality: string[];
}

interface ProductList {
  items: Product[];
  total: number;
}

const DECISION_COLORS: Record<string, string> = {
  PENDING: 'bg-neutral-100 text-neutral-700',
  APPROVED: 'bg-green-100 text-green-800',
  REJECTED: 'bg-red-100 text-red-800',
  DISCONTINUED: 'bg-neutral-200 text-neutral-500',
};

export const Route = createFileRoute('/products')({
  component: ProductsPage,
  beforeLoad: async () => {
    const { data } = await authClient.getSession();
    if (!data) throw redirect({ to: '/sign-in' });
  },
});

function marginPct(cost: string, retail: string | null): string {
  if (!retail) return '—';
  const c = parseFloat(cost);
  const r = parseFloat(retail);
  if (!c || !r) return '—';
  return `${(((r - c) / r) * 100).toFixed(0)}%`;
}

function ProductsPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['products'],
    queryFn: () => api.get<ProductList>('/api/products'),
  });

  return (
    <section>
      <header className="mb-6">
        <h1 className="text-2xl font-semibold">Produtos</h1>
        <p className="text-sm text-neutral-500">{data ? `${data.total} SKUs` : 'A carregar…'}</p>
      </header>

      {isLoading && <div className="text-neutral-500">A carregar…</div>}
      {error && <div className="text-red-600">Erro: {error.message}</div>}

      {data?.items.length === 0 && (
        <div className="rounded-md border border-dashed bg-white p-12 text-center text-neutral-500">
          Sem produtos. Adiciona via API por agora.
        </div>
      )}

      {data && data.items.length > 0 && (
        <div className="overflow-hidden rounded-md border bg-white">
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 text-left text-xs uppercase tracking-wide text-neutral-500">
              <tr>
                <th className="px-3 py-2">SKU</th>
                <th className="px-3 py-2">Produto</th>
                <th className="px-3 py-2">Categoria</th>
                <th className="px-3 py-2">Nota</th>
                <th className="px-3 py-2">Visual</th>
                <th className="px-3 py-2">Decisão</th>
                <th className="px-3 py-2">Custo</th>
                <th className="px-3 py-2">PVP</th>
                <th className="px-3 py-2">Margem</th>
                <th className="px-3 py-2">Sazon.</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {data.items.map((p) => (
                <tr key={p.id} className="hover:bg-neutral-50">
                  <td className="px-3 py-2 font-mono text-xs">{p.sku}</td>
                  <td className="px-3 py-2 font-medium">
                    {p.name}
                    {p.isAnchor && (
                      <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                        âncora
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-neutral-600">{p.category}</td>
                  <td className="px-3 py-2">{p.score ?? '—'}</td>
                  <td className="px-3 py-2">{p.visualScore ?? '—'}</td>
                  <td className="px-3 py-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        DECISION_COLORS[p.decision] ?? ''
                      }`}
                    >
                      {p.decision}
                    </span>
                  </td>
                  <td className="px-3 py-2">€{p.costEur}</td>
                  <td className="px-3 py-2">
                    {p.recommendedRetailEur ? `€${p.recommendedRetailEur}` : '—'}
                  </td>
                  <td className="px-3 py-2">{marginPct(p.costEur, p.recommendedRetailEur)}</td>
                  <td className="px-3 py-2">
                    <div className="flex flex-wrap gap-1">
                      {p.seasonality.slice(0, 2).map((s) => (
                        <span key={s} className="rounded-full bg-neutral-100 px-1.5 py-0.5 text-xs">
                          {s}
                        </span>
                      ))}
                    </div>
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
