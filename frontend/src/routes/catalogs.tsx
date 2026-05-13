import { createFileRoute } from '@tanstack/react-router';

import { MockPage } from '@/components/ui/MockPage';

export const Route = createFileRoute('/catalogs')({
  component: CatalogsPage,
});

function CatalogsPage() {
  return <MockPage title="Catálogos PDF" subtitle="Geração e envio de catálogos para floristas" />;
}
