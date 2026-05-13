import { createFileRoute } from '@tanstack/react-router';

import { MockPage } from '@/components/ui/MockPage';

export const Route = createFileRoute('/scraping')({
  component: ScrapingPage,
});

function ScrapingPage() {
  return <MockPage title="Scraping" subtitle="Monitorização de preços e tendências de mercado" />;
}
