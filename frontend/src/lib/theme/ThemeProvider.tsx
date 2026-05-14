// frontend/src/lib/theme/ThemeProvider.tsx
import { createContext, useCallback, useContext, useState } from 'react';
import type { ReactNode } from 'react';

import { applyThemeMode, readStoredTheme, THEME_STORAGE_KEY } from './theme';
import type { ThemeMode } from './theme';

interface ThemeContextValue {
  theme: ThemeMode;
  /** Define o tema: state + localStorage + data-theme no <html>. */
  setTheme: (theme: ThemeMode) => void;
  /** Alterna claro <-> escuro. */
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>(() => readStoredTheme());

  const setTheme = useCallback((next: ThemeMode) => {
    setThemeState(next);
    window.localStorage.setItem(THEME_STORAGE_KEY, next);
    applyThemeMode(next);
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => {
      const next: ThemeMode = prev === 'dark' ? 'light' : 'dark';
      window.localStorage.setItem(THEME_STORAGE_KEY, next);
      applyThemeMode(next);
      return next;
    });
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme deve ser usado dentro de <ThemeProvider>');
  }
  return ctx;
}
