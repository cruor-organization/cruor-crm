/**
 * Dados simulados para o hub do ecossistema — o ponto de entrada pós-login.
 * Apenas a app "CRM" é navegável; o resto são cartões de contexto ambiente.
 */

export type HubAppStatus = 'live' | 'soon';

export interface HubApp {
  id: string;
  name: string;
  /** Descrição curta para o cartão. */
  tagline: string;
  status: HubAppStatus;
}

/** Apps do ecossistema. Hoje só o CRM está ligado; o resto fica "Em breve". */
export const ecosystemApps: HubApp[] = [
  {
    id: 'crm',
    name: 'Cruor CRM',
    tagline: '4 espaços comerciais num só sítio',
    status: 'live',
  },
  {
    id: 'billing',
    name: 'Faturação',
    tagline: 'Faturas, recibos e SAF-T',
    status: 'soon',
  },
  {
    id: 'flows',
    name: 'Automações',
    tagline: 'Fluxos entre apps do ecossistema',
    status: 'soon',
  },
];

/** Os 4 espaços dentro do CRM — espelham lib/crm/presets para o cartão herói. */
export const crmSpaces: { chip: string; name: string; swatch: string }[] = [
  { chip: 'Fl', name: 'Flora', swatch: '#3568E0' },
  { chip: 'Fg', name: 'Forge', swatch: '#0E8C7C' },
  { chip: 'Pl', name: 'Pulse', swatch: '#C02C5E' },
  { chip: 'St', name: 'Studio', swatch: '#7233D6' },
];

export interface HubTeamMember {
  initials: string;
  name: string;
  online: boolean;
}

export interface HubStats {
  /** Receita agregada do ecossistema, 30 dias, em euros. */
  revenueEur: number;
  revenueDelta: string;
  team: HubTeamMember[];
  uptimePct: string;
}

export const hubStats: HubStats = {
  revenueEur: 18240,
  revenueDelta: '+12,4%',
  team: [
    { initials: 'TS', name: 'Tiago Sousa', online: true },
    { initials: 'AF', name: 'Ana Ferreira', online: true },
    { initials: 'RC', name: 'Rui Costa', online: true },
    { initials: 'MM', name: 'Marta Matos', online: false },
    { initials: 'JP', name: 'João Pinto', online: false },
  ],
  uptimePct: '99,9%',
};
