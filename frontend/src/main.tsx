// frontend/src/main.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider, createRouter } from '@tanstack/react-router';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import '@fontsource-variable/hanken-grotesk';
import '@fontsource-variable/jetbrains-mono';
import './styles/globals.css';
import { CrmProvider } from './lib/crm/CrmProvider';
import { initCrmTheme } from './lib/crm/theme';
import { initThemeMode } from './lib/theme/theme';
import { ThemeProvider } from './lib/theme/ThemeProvider';
import { routeTree } from './routeTree.gen';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 60 * 1000, retry: 1 },
  },
});

const router = createRouter({
  routeTree,
  context: { queryClient },
  defaultPreload: 'intent',
});

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

const container = document.getElementById('root');
if (!container) throw new Error('Missing #root');

// Antes do primeiro paint (evita flash): primeiro o modo claro/escuro, depois
// as vars do CRM — applyCrmTheme é theme-aware, precisa do tema já resolvido.
const initialTheme = initThemeMode();
initCrmTheme(initialTheme);

createRoot(container).render(
  <StrictMode>
    <ThemeProvider>
      <CrmProvider>
        <QueryClientProvider client={queryClient}>
          <RouterProvider router={router} />
        </QueryClientProvider>
      </CrmProvider>
    </ThemeProvider>
  </StrictMode>,
);
