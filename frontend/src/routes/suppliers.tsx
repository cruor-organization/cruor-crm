import { useQuery } from '@tanstack/react-query';
import { createFileRoute, redirect } from '@tanstack/react-router';

import { api } from '@/lib/api';
import { authClient } from '@/lib/auth-client';

interface Supplier {
  id: string;
  name: string;
  country: string;
  type: string;
  status: string;
  defaultLeadTimeDays: number | null;
  scoreCache: number | null;
  tags: string[];
}

interface SupplierList {
  items: Supplier[];
  total: number;
}

export const Route = createFileRoute('/suppliers')({
  component: SuppliersPage,
  beforeLoad: async () => {
    const { data } = await authClient.getSession();
    if (!data) throw redirect({ to: '/sign-in' });
  },
});

function SuppliersPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['suppliers'],
    queryFn: () => api.get<SupplierList>('/api/suppliers'),
  });

  return (
    <section>
      <header className="mb-6">
        <h1 className="text-2xl font-semibold">Fornecedores</h1>
        <p className="text-sm text-neutral-500">
          {data ? `${data.total} registos` : 'A carregar…'}
        </p>
      </header>

      {isLoading && <div className="text-neutral-500">A carregar…</div>}
      {error && <div className="text-red-600">Erro: {error.message}</div>}

      {data?.items.length === 0 && (
        <div className="rounded-md border border-dashed bg-white p-12 text-center text-neutral-500">
          Sem fornecedores. Adiciona via API por agora (formulário chega em iteração seguinte).
        </div>
      )}

      {data && data.items.length > 0 && (
        <div className="overflow-hidden rounded-md border bg-white">
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 text-left text-xs uppercase tracking-wide text-neutral-500">
              <tr>
                <th className="px-4 py-2">Nome</th>
                <th className="px-4 py-2">País</th>
                <th className="px-4 py-2">Tipo</th>
                <th className="px-4 py-2">Lead time</th>
                <th className="px-4 py-2">Score</th>
                <th className="px-4 py-2">Tags</th>
                <th className="px-4 py-2">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {data.items.map((s) => (
                <tr key={s.id} className="hover:bg-neutral-50">
                  <td className="px-4 py-2 font-medium">{s.name}</td>
                  <td className="px-4 py-2">{s.country}</td>
                  <td className="px-4 py-2">{s.type}</td>
                  <td className="px-4 py-2">
                    {s.defaultLeadTimeDays != null ? `${s.defaultLeadTimeDays}d` : '—'}
                  </td>
                  <td className="px-4 py-2">
                    {s.scoreCache != null ? `${s.scoreCache}/100` : '—'}
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex flex-wrap gap-1">
                      {s.tags.map((t) => (
                        <span
                          key={t}
                          className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs text-neutral-700"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-2">{s.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
