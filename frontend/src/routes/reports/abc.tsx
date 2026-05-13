import { createFileRoute } from '@tanstack/react-router';

import { MockPage } from '@/components/ui/MockPage';

export const Route = createFileRoute('/reports/abc')({
  component: AbcPage,
});

function AbcPage() {
  return (
    <MockPage
      title="ABC clientes"
      subtitle="Segmentação de floristas por volume de compras (Pareto)"
    />
  );
}
