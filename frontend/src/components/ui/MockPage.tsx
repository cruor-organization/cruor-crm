import { MockBadge } from '@/components/MockBadge';
import { EmptyState } from '@/components/ui/EmptyState';
import { PageHeader } from '@/components/ui/PageHeader';

interface MockPageProps {
  title: string;
  subtitle?: string;
}

/**
 * Placeholder para páginas ainda não implementadas.
 * Usar enquanto o backend/lógica correspondente não existe.
 */
export function MockPage({ title, subtitle }: MockPageProps) {
  return (
    <div>
      <PageHeader title={title} subtitle={subtitle} action={<MockBadge />} />
      <EmptyState
        title="Em construção"
        description="Esta secção ainda não foi implementada. Dados reais chegam numa fase futura."
      />
    </div>
  );
}
