import { useQuery } from '@tanstack/react-query';
import { createFileRoute, redirect } from '@tanstack/react-router';

import { CustomerForm } from '@/components/forms/CustomerForm';
import { Skeleton } from '@/components/ui/Skeleton';
import { api } from '@/lib/api';
import { authClient } from '@/lib/auth-client';

interface CustomerDetail {
  id: string;
  businessType: string;
  legalName: string;
  tradingName: string | null;
  taxId: string | null;
  taxCountry: string | null;
  status: string;
  phonePrimary: string | null;
  whatsappNumber: string | null;
  email: string | null;
  website: string | null;
  instagramHandle: string | null;
  preferredChannel: string | null;
  pricingTier: string;
  salesRepId: string | null;
  creditLimitEur: string;
  paymentTermDays: number;
  preferredDeliveryDay: string | null;
  shopSizeSqm: number | null;
  estimatedMonthlyVolumeEur: string | null;
  peakSeasons: string[];
  createdAt: string;
}

interface Activity {
  id: string;
  kind: string;
  occurredAt: string;
  payload: unknown;
}

interface ActivityList {
  items: Activity[];
  total: number;
}

const KIND_LABELS: Record<string, string> = {
  CALL: 'Chamada',
  VISIT: 'Visita',
  MEETING: 'Reunião',
  WHATSAPP_IN: 'WhatsApp recebido',
  WHATSAPP_OUT: 'WhatsApp enviado',
  EMAIL_IN: 'Email recebido',
  EMAIL_OUT: 'Email enviado',
  ORDER_PLACED: 'Encomenda colocada',
  ORDER_DELIVERED: 'Encomenda entregue',
  RETURN_OPENED: 'Devolução aberta',
  NOTE: 'Nota',
  CONVERTED_FROM_LEAD: 'Convertido de lead',
  STATUS_CHANGED: 'Estado alterado',
};

export const Route = createFileRoute('/customers/$id')({
  component: CustomerDetailPage,
  beforeLoad: async () => {
    const { data } = await authClient.getSession();
    if (!data) throw redirect({ to: '/sign-in' });
  },
});

function CustomerDetailPage() {
  const { id } = Route.useParams();

  const { data: customer, isLoading } = useQuery({
    queryKey: ['customer', id],
    queryFn: () => api.get<CustomerDetail>(`/api/customers/${id}`),
  });

  const { data: activitiesData } = useQuery({
    queryKey: ['customer', id, 'activities'],
    queryFn: () => api.get<ActivityList>(`/api/customers/${id}/activities`),
    enabled: !!customer,
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton height="h-8" width="w-64" />
        <Skeleton height="h-64" width="w-full" />
      </div>
    );
  }

  if (!customer) {
    return <div className="py-12 text-center text-neutral-500">Florista não encontrado.</div>;
  }

  return (
    <section>
      <header className="mb-6">
        <h1 className="text-2xl font-semibold">{customer.legalName}</h1>
        {customer.tradingName && <p className="text-sm text-neutral-500">{customer.tradingName}</p>}
      </header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Formulário de edição */}
        <div className="lg:col-span-2">
          <div className="rounded-lg border bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-neutral-500">
              Dados
            </h2>
            <CustomerForm mode="edit" customer={customer} />
          </div>
        </div>

        {/* Timeline de atividades */}
        <div>
          <div className="rounded-lg border bg-white p-4 shadow-sm">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-neutral-500">
              Atividade recente
            </h2>

            {!activitiesData?.items.length && (
              <p className="text-sm text-neutral-500">Sem atividade registada.</p>
            )}

            <ol className="space-y-4">
              {activitiesData?.items.map((act) => (
                <li key={act.id} className="flex gap-3">
                  <div className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-cruor-500" />
                  <div>
                    <p className="text-sm font-medium text-neutral-800">
                      {KIND_LABELS[act.kind] ?? act.kind}
                    </p>
                    <p className="text-xs text-neutral-500">
                      {new Date(act.occurredAt).toLocaleDateString('pt-PT', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </section>
  );
}
