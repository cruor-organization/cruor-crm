// frontend/src/lib/crm/CrmProvider.tsx
import { createContext, useCallback, useContext, useState } from 'react';
import type { ReactNode } from 'react';

import { CRMS, getCrmPreset } from './presets';
import { applyCrmTheme, CRM_STORAGE_KEY, readStoredCrmId } from './theme';
import type { CrmId, CrmPreset } from './types';

interface CrmContextValue {
  activeCrm: CrmPreset;
  crms: CrmPreset[];
  /** Atualiza o CRM ativo: state + localStorage + tema. NÃO navega. */
  setCrm: (id: CrmId) => void;
}

const CrmContext = createContext<CrmContextValue | null>(null);

export function CrmProvider({ children }: { children: ReactNode }) {
  const [activeCrmId, setActiveCrmId] = useState<CrmId>(() => readStoredCrmId());

  const setCrm = useCallback((id: CrmId) => {
    setActiveCrmId(id);
    window.localStorage.setItem(CRM_STORAGE_KEY, id);
    applyCrmTheme(getCrmPreset(id));
  }, []);

  const value: CrmContextValue = {
    activeCrm: getCrmPreset(activeCrmId),
    crms: CRMS,
    setCrm,
  };

  return <CrmContext.Provider value={value}>{children}</CrmContext.Provider>;
}

export function useCrm(): CrmContextValue {
  const ctx = useContext(CrmContext);
  if (!ctx) {
    throw new Error('useCrm deve ser usado dentro de <CrmProvider>');
  }
  return ctx;
}
