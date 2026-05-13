import { useQuery, useQueryClient } from '@tanstack/react-query';
import { createFileRoute, redirect } from '@tanstack/react-router';
import { useState } from 'react';

import { SupplierForm } from '@/components/forms/SupplierForm';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
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
  incoterms: string | null;
  notes: string | null;
  contacts: unknown[];
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
  const [showCreate, setShowCreate] = useState(false);
  const [editTarget, setEditTarget] = useState<Supplier | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Supplier | null>(null);
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ['suppliers'],
    queryFn: () => api.get<SupplierList>('/api/suppliers'),
  });

  const handleDelete = async (supplier: Supplier) => {
    await api.delete(`/api/suppliers/${supplier.id}`);
    await queryClient.invalidateQueries({ queryKey: ['suppliers'] });
    setDeleteTarget(null);
  };

  return (
    <section>
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Fornecedores</h1>
          <p className="text-sm text-neutral-500">
            {data ? `${data.total} registos` : 'A carregar…'}
          </p>
        </div>
        <Button onClick={() => setShowCreate(true)}>Novo fornecedor</Button>
      </header>

      {isLoading && <div className="text-neutral-500">A carregar…</div>}
      {error && <div className="text-red-600">Erro: {error.message}</div>}

      {data?.items.length === 0 && (
        <div className="rounded-md border border-dashed bg-white p-12 text-center text-neutral-500">
          Sem fornecedores ainda. Cria o primeiro.
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
                <th className="px-4 py-2" />
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
                  <td className="px-4 py-2">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        className="text-xs text-emerald-600 hover:underline"
                        onClick={() => setEditTarget(s)}
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        className="text-xs text-red-600 hover:underline"
                        onClick={() => setDeleteTarget(s)}
                      >
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal criar */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Novo fornecedor">
        <SupplierForm mode="create" onSuccess={() => setShowCreate(false)} />
      </Modal>

      {/* Modal editar */}
      <Modal
        open={!!editTarget}
        onClose={() => setEditTarget(null)}
        title={`Editar: ${editTarget?.name ?? ''}`}
      >
        {editTarget && (
          <SupplierForm mode="edit" supplier={editTarget} onSuccess={() => setEditTarget(null)} />
        )}
      </Modal>

      {/* Modal confirmar eliminação */}
      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Confirmar eliminação"
      >
        {deleteTarget && (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-neutral-700">
              Tens a certeza que queres eliminar <strong>{deleteTarget.name}</strong>? Esta ação não
              pode ser desfeita.
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setDeleteTarget(null)}>
                Cancelar
              </Button>
              <Button
                variant="primary"
                className="bg-red-600 hover:bg-red-700"
                onClick={() => void handleDelete(deleteTarget)}
              >
                Eliminar
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </section>
  );
}
