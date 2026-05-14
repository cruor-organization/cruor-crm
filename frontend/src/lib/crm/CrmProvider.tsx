// frontend/src/lib/crm/CrmProvider.tsx
import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';

import { useTheme } from '../theme/ThemeProvider';

import { CRMS, getCrmPreset } from './presets';
import { applyCrmTheme, CRM_STORAGE_KEY, readStoredCrmId } from './theme';
import type { CrmId, CrmPreset } from './types';

interface CrmContextValue {
  activeCrm: CrmPreset;
  crms: CrmPreset[];
  /** Atualiza o CRM ativo: state + localStorage. O tema é reaplicado por efeito. */
  setCrm: (id: CrmId) => void;
}

const CrmContext = createContext<CrmContextValue | null>(null);

export function CrmProvider({ children }: { children: ReactNode }) {
  const [activeCrmId, setActiveCrmId] = useState<CrmId>(() => readStoredCrmId());
  const { theme } = useTheme();

  // Reaplica as CSS vars sempre que o CRM OU o tema muda — applyCrmTheme é
  // theme-aware (neutros e tons baixos do acento dependem do tema).
  useEffect(() => {
    applyCrmTheme(getCrmPreset(activeCrmId), theme);
  }, [activeCrmId, theme]);

  const setCrm = useCallback((id: CrmId) => {
    setActiveCrmId(id);
    window.localStorage.setItem(CRM_STORAGE_KEY, id);
  }, []);

  const value: CrmContextValue = {
    activeCrm: getCrmPreset(activeCrmId),
    crms: CRMS,
    setCrm,
  };

  return <CrmContext.Provider value={value}>{children}</CrmContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useCrm(): CrmContextValue {
  const ctx = useContext(CrmContext);
  if (!ctx) {
    throw new Error('useCrm deve ser usado dentro de <CrmProvider>');
  }
  return ctx;
}
