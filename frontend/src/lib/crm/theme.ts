// frontend/src/lib/crm/theme.ts
import { CRMS, DEFAULT_CRM_ID, getCrmPreset } from './presets';
import type { CrmId, CrmPreset, Shade } from './types';

export const CRM_STORAGE_KEY = 'cruor:active-crm';

const SHADES: Shade[] = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];

/** Escreve as ~22 CSS vars + data-crm no <html>. Sem modo de falha realista. */
export function applyCrmTheme(preset: CrmPreset): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  for (const shade of SHADES) {
    root.style.setProperty(`--cruor-${shade}`, preset.colors.cruor[shade]);
    root.style.setProperty(`--neutral-${shade}`, preset.colors.neutral[shade]);
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

/** Corre antes do React (main.tsx): aplica o tema guardado, sem flash. */
export function initCrmTheme(): CrmId {
  const id = readStoredCrmId();
  applyCrmTheme(getCrmPreset(id));
  return id;
}
