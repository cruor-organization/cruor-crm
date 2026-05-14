// frontend/src/lib/crm/types.ts
import type { LucideIcon } from 'lucide-react';

export type CrmId = 'florista' | 'forge' | 'pulse' | 'studio';

export type Shade = 50 | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900 | 950;

export interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  /** Badge "mock" na sidebar (usado pelo CRM Flora nas páginas ainda não ligadas). */
  mock?: boolean;
}

export interface NavGroup {
  groupLabel: string;
  items: NavItem[];
}

export interface CrmPreset {
  id: CrmId;
  /** Título no switcher — ex. 'Cruor Forge'. */
  name: string;
  /** Subtítulo no switcher — ex. 'Software à medida'. */
  area: string;
  /** 1–2 chars no chip colorido do switcher. */
  chip: string;
  /** Hex do acento, para o ponto de cor no dropdown. */
  swatch: string;
  /** Escalas de cor como triplos RGB separados por espaço: '53 104 224'. */
  colors: {
    cruor: Record<Shade, string>;
    neutral: Record<Shade, string>;
  };
  navGroups: NavGroup[];
}
