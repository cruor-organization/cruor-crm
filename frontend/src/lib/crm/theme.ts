// frontend/src/lib/crm/theme.ts
import type { ThemeMode } from '../theme/theme';

import { CRMS, DEFAULT_CRM_ID, getCrmPreset } from './presets';
import type { CrmId, CrmPreset, Shade } from './types';

export const CRM_STORAGE_KEY = 'cruor:active-crm';

const SHADES: Shade[] = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];

/**
 * Rampa neutra escura — PARTILHADA pelos 4 CRMs (só o acento varia). Mantém a
 * convenção dos índices (50 = superfície elevada, 100 = canvas, 900 = texto),
 * mas com valores afinados para fundo escuro. Não é uma inversão matemática:
 * superfícies escuras pedem ligeira dessaturação e o "texto" não é branco puro.
 */
const DARK_NEUTRALS: Record<Shade, string> = {
  50: '19 21 26',
  100: '13 14 18',
  200: '32 35 42',
  300: '46 50 59',
  400: '114 120 132',
  500: '141 147 159',
  600: '166 172 183',
  700: '195 200 209',
  800: '217 220 227',
  900: '234 236 240',
  950: '247 248 250',
};

// Em escuro, os tons baixos do acento (50/100/200) servem de fundo tingido.
// Misturam-se com o canvas escuro a partir do acento médio do CRM (cruor-500).
const DARK_CRUOR_TINT: Partial<Record<Shade, number>> = { 50: 0.1, 100: 0.15, 200: 0.25 };

/** Mistura dois triplos "r g b" num rácio t ∈ [0,1] (0 = a, 1 = b). */
function mixRgb(a: string, b: string, t: number): string {
  const pa = a.split(' ').map(Number);
  const pb = b.split(' ').map(Number);
  return pa.map((v, i) => Math.round(v + ((pb[i] ?? 0) - v) * t)).join(' ');
}

/**
 * Escreve as ~22 CSS vars + data-crm no <html>. Theme-aware: em modo escuro os
 * neutros vêm da rampa partilhada e os tons baixos do acento são tingidos sobre
 * o canvas escuro. Estilo inline — vence as regras de globals.css de propósito.
 */
export function applyCrmTheme(preset: CrmPreset, theme: ThemeMode): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  const dark = theme === 'dark';
  const accent = preset.colors.cruor[500];

  for (const shade of SHADES) {
    // Neutros — preset em claro, rampa partilhada em escuro.
    root.style.setProperty(
      `--neutral-${shade}`,
      dark ? DARK_NEUTRALS[shade] : preset.colors.neutral[shade],
    );

    // Acento — preset sempre, exceto os tons baixos em escuro (fundo tingido).
    const tint = DARK_CRUOR_TINT[shade];
    root.style.setProperty(
      `--cruor-${shade}`,
      dark && tint !== undefined
        ? mixRgb(DARK_NEUTRALS[100], accent, tint)
        : preset.colors.cruor[shade],
    );
  }

  root.dataset.crm = preset.id;
}

/**
 * Lê o CRM ativo do localStorage. Se faltar ou for inválido, cai para o
 * DEFAULT_CRM_ID e reescreve a chave (spec §7).
 */
export function readStoredCrmId(): CrmId {
  if (typeof window === 'undefined') return DEFAULT_CRM_ID;
  const stored = window.localStorage.getItem(CRM_STORAGE_KEY);
  if (stored && CRMS.some((c) => c.id === stored)) {
    return stored as CrmId;
  }
  window.localStorage.setItem(CRM_STORAGE_KEY, DEFAULT_CRM_ID);
  return DEFAULT_CRM_ID;
}

/** Corre antes do React (main.tsx): aplica o tema do CRM guardado, sem flash. */
export function initCrmTheme(theme: ThemeMode): CrmId {
  const id = readStoredCrmId();
  applyCrmTheme(getCrmPreset(id), theme);
  return id;
}
