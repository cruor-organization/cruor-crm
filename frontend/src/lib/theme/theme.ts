// frontend/src/lib/theme/theme.ts
//
// Tema claro/escuro — global, ortogonal ao acento por-CRM. Espelho do par
// lib/crm/theme.ts: lê/escreve uma chave de localStorage e o atributo
// data-theme no <html>. Os valores de cor escuros vivem em globals.css
// (camada 2) e em applyCrmTheme() (camada 1, neutros/acento).

export type ThemeMode = 'light' | 'dark';

export const THEME_STORAGE_KEY = 'cruor:theme';

const THEMES: ThemeMode[] = ['light', 'dark'];

/** Escreve data-theme no <html>. As regras CSS e applyCrmTheme() reagem a isto. */
export function applyThemeMode(theme: ThemeMode): void {
  if (typeof document === 'undefined') return;
  document.documentElement.dataset.theme = theme;
}

/**
 * Lê o tema ativo do localStorage. Na primeira visita (chave ausente) semeia a
 * partir de `prefers-color-scheme` e grava. Valor inválido cai para 'light' e
 * reescreve — mesmo padrão de readStoredCrmId().
 */
export function readStoredTheme(): ThemeMode {
  if (typeof window === 'undefined') return 'light';
  const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
  if (stored && THEMES.includes(stored as ThemeMode)) {
    return stored as ThemeMode;
  }
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const seeded: ThemeMode = prefersDark ? 'dark' : 'light';
  window.localStorage.setItem(THEME_STORAGE_KEY, seeded);
  return seeded;
}

/** Corre antes do React (main.tsx): aplica o tema guardado, sem flash. */
export function initThemeMode(): ThemeMode {
  const theme = readStoredTheme();
  applyThemeMode(theme);
  return theme;
}
