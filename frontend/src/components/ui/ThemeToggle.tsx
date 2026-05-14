// frontend/src/components/ui/ThemeToggle.tsx
//
// Botão de tema claro/escuro. Estilo neutro (tokens) — assenta tanto na topbar
// das CRMs como na chrome do hub/auth. Os dois ícones ficam empilhados e
// trocam por opacidade + rotação, sem reflow.
import { Moon, Sun } from 'lucide-react';

import { useTheme } from '@/lib/theme/ThemeProvider';

export function ThemeToggle({ className = '' }: { className?: string }) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`relative grid h-9 w-9 place-items-center rounded-full border border-neutral-200 bg-surface text-neutral-500 transition-colors hover:bg-neutral-50 hover:text-neutral-800 ${className}`}
      aria-label={isDark ? 'Mudar para tema claro' : 'Mudar para tema escuro'}
      title={isDark ? 'Tema claro' : 'Tema escuro'}
    >
      <Sun
        size={16}
        className={`col-start-1 row-start-1 transition-all duration-300 ${
          isDark ? 'rotate-90 scale-50 opacity-0' : 'rotate-0 scale-100 opacity-100'
        }`}
      />
      <Moon
        size={16}
        className={`col-start-1 row-start-1 transition-all duration-300 ${
          isDark ? 'rotate-0 scale-100 opacity-100' : '-rotate-90 scale-50 opacity-0'
        }`}
      />
    </button>
  );
}
