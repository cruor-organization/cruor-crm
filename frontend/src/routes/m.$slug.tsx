// frontend/src/routes/m.$slug.tsx
import { createFileRoute, redirect } from '@tanstack/react-router';
import { Sparkles } from 'lucide-react';

import { PageHeader } from '@/components/ui/PageHeader';
import { authClient } from '@/lib/auth-client';
import { useCrm } from '@/lib/crm/CrmProvider';

export const Route = createFileRoute('/m/$slug')({
  component: ModulePlaceholder,
  beforeLoad: async () => {
    const { data } = await authClient.getSession();
    if (!data) {
      throw redirect({ to: '/sign-in' });
    }
  },
});

function humanizeSlug(slug: string): string {
  const s = slug.replace(/-/g, ' ');
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function ModulePlaceholder() {
  const { slug } = Route.useParams();
  const { activeCrm } = useCrm();

  // Procura o item de nav correspondente no CRM ativo para o título/ícone reais.
  let label = humanizeSlug(slug);
  let groupLabel = '';
  let Icon = Sparkles;
  for (const group of activeCrm.navGroups) {
    const item = group.items.find((i) => i.to === `/m/${slug}`);
    if (item) {
      label = item.label;
      groupLabel = group.groupLabel;
      Icon = item.icon;
      break;
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title={label} subtitle={groupLabel || activeCrm.area} />
      <div className="flex flex-col items-center justify-center rounded-card border border-neutral-200 bg-surface px-6 py-20 text-center shadow-card">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-cruor-50 text-cruor-600">
          <Icon size={26} />
        </span>
        <h2 className="mt-5 text-lg font-semibold text-neutral-900">{label}</h2>
        <p className="mt-1.5 max-w-sm text-sm text-neutral-500">
          Módulo de exemplo do CRM{' '}
          <span className="font-medium text-neutral-700">{activeCrm.name}</span>. Esta área
          demonstra a estrutura de navegação — ainda sem ecrã dedicado.
        </p>
      </div>
    </div>
  );
}
