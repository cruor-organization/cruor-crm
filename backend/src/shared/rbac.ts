/**
 * RBAC — enum §8 do prompt e helpers de autorização.
 *
 * O backend é a única fonte de verdade para o conjunto de roles. O
 * `member.role` (Better Auth) guarda estes valores como string.
 */

export const APP_ROLES = [
  'OWNER',
  'ADMIN',
  'SALES_MANAGER',
  'SALES_REP',
  'WAREHOUSE',
  'MARKETING',
  'VIEWER',
] as const;

export type AppRole = (typeof APP_ROLES)[number];

export function isAppRole(value: unknown): value is AppRole {
  return typeof value === 'string' && (APP_ROLES as readonly string[]).includes(value);
}

/**
 * Hierarquia para "X tem pelo menos os privilégios de Y".
 * Não é uma estrita escada — alguns roles são paralelos (ex.: SALES_REP vs WAREHOUSE).
 * Por isso usamos sets explícitos em vez de >= comparáveis.
 */
const ROLE_INHERITS: Record<AppRole, readonly AppRole[]> = {
  OWNER: ['OWNER', 'ADMIN', 'SALES_MANAGER', 'SALES_REP', 'WAREHOUSE', 'MARKETING', 'VIEWER'],
  ADMIN: ['ADMIN', 'SALES_MANAGER', 'SALES_REP', 'WAREHOUSE', 'MARKETING', 'VIEWER'],
  SALES_MANAGER: ['SALES_MANAGER', 'SALES_REP', 'VIEWER'],
  SALES_REP: ['SALES_REP', 'VIEWER'],
  WAREHOUSE: ['WAREHOUSE', 'VIEWER'],
  MARKETING: ['MARKETING', 'VIEWER'],
  VIEWER: ['VIEWER'],
};

export function hasRole(actual: AppRole, required: AppRole): boolean {
  return ROLE_INHERITS[actual].includes(required);
}

export function hasAnyRole(actual: AppRole, required: readonly AppRole[]): boolean {
  return required.some((r) => hasRole(actual, r));
}
