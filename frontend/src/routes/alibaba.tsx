import { createFileRoute } from '@tanstack/react-router';

import { MockPage } from '@/components/ui/MockPage';

export const Route = createFileRoute('/alibaba')({
  component: AlibabaPage,
});

function AlibabaPage() {
  return (
    <MockPage
      title="Alibaba"
      subtitle="Encomendas a fornecedores Alibaba e tracking de importação"
    />
  );
}
