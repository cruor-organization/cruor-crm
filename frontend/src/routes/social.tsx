import { createFileRoute } from '@tanstack/react-router';

import { MockPage } from '@/components/ui/MockPage';

export const Route = createFileRoute('/social')({
  component: SocialPage,
});

function SocialPage() {
  return (
    <MockPage title="Redes sociais" subtitle="Publicação e gestão de conteúdo nas redes sociais" />
  );
}
