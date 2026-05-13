import { createFileRoute } from '@tanstack/react-router';

import { MockPage } from '@/components/ui/MockPage';

export const Route = createFileRoute('/campaigns')({
  component: CampaignsPage,
});

function CampaignsPage() {
  return <MockPage title="Campanhas" subtitle="Campanhas sazonais e promoções para floristas" />;
}
