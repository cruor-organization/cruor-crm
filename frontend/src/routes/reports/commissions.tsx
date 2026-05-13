import { createFileRoute } from '@tanstack/react-router';

import { MockPage } from '@/components/ui/MockPage';

export const Route = createFileRoute('/reports/commissions')({
  component: CommissionsPage,
});

function CommissionsPage() {
  return (
    <MockPage title="Comissões" subtitle="Relatório de comissões por representante comercial" />
  );
}
