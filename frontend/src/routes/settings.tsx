import { createFileRoute } from '@tanstack/react-router';

import { MockPage } from '@/components/ui/MockPage';

export const Route = createFileRoute('/settings')({
  component: SettingsPage,
});

function SettingsPage() {
  return (
    <MockPage
      title="Organização"
      subtitle="Configurações da organização, utilizadores e permissões"
    />
  );
}
