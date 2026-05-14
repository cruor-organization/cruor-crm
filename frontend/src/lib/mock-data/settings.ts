/**
 * Mock data para Configurações: organização, utilizadores, integrações e auditoria.
 */

export interface OrgInfo {
  name: string;
  nif: string;
  address: string;
  locale: string;
  currency: string;
  vatDefault: number;
  phone: string;
  email: string;
}

export type UserRole = 'OWNER' | 'ADMIN' | 'SALES_MANAGER' | 'SALES_REP' | 'WAREHOUSE';
export type UserStatus = 'active' | 'invited' | 'suspended';

export interface OrgUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  lastActiveAt: string | null;
}

export type IntegrationStatus = 'connected' | 'disconnected' | 'error';

export interface Integration {
  id: string;
  name: string;
  description: string;
  status: IntegrationStatus;
  category: string;
  lastCheckedAt?: string;
}

export interface AuditEntry {
  id: string;
  who: string;
  action: string;
  entity: string;
  entityId: string;
  when: string;
  ip?: string;
}

export const mockOrgInfo: OrgInfo = {
  name: 'Cruor Flores Preservadas Lda.',
  nif: '514 382 901',
  address: 'Rua das Flores 42, 1200-192 Lisboa',
  locale: 'pt-PT',
  currency: 'EUR',
  vatDefault: 23,
  phone: '+351 21 000 0000',
  email: 'geral@cruorflores.pt',
};

export const mockOrgUsers: OrgUser[] = [
  {
    id: 'u001',
    name: 'Tiago Sousa',
    email: 'tiago@cruorflores.pt',
    role: 'OWNER',
    status: 'active',
    lastActiveAt: '2026-05-14T09:12:00Z',
  },
  {
    id: 'u002',
    name: 'Ana Santos',
    email: 'ana.santos@cruorflores.pt',
    role: 'SALES_MANAGER',
    status: 'active',
    lastActiveAt: '2026-05-14T08:45:00Z',
  },
  {
    id: 'u003',
    name: 'Bruno Ferreira',
    email: 'bruno.ferreira@cruorflores.pt',
    role: 'SALES_REP',
    status: 'active',
    lastActiveAt: '2026-05-13T17:30:00Z',
  },
  {
    id: 'u004',
    name: 'Catarina Lopes',
    email: 'catarina.lopes@cruorflores.pt',
    role: 'SALES_REP',
    status: 'active',
    lastActiveAt: '2026-05-13T16:00:00Z',
  },
  {
    id: 'u005',
    name: 'Diogo Martins',
    email: 'diogo.martins@cruorflores.pt',
    role: 'WAREHOUSE',
    status: 'active',
    lastActiveAt: '2026-05-14T07:00:00Z',
  },
];

export const mockIntegrations: Integration[] = [
  {
    id: 'int-resend',
    name: 'Resend',
    description: 'Envio de emails transaccionais (facturas, convites, alertas).',
    status: 'connected',
    category: 'Email',
    lastCheckedAt: '2026-05-14T09:00:00Z',
  },
  {
    id: 'int-evolution',
    name: 'Evolution API — WhatsApp',
    description: 'Canal principal de comunicação com floristas via WhatsApp Business.',
    status: 'connected',
    category: 'Mensagens',
    lastCheckedAt: '2026-05-14T09:00:00Z',
  },
  {
    id: 'int-n8n',
    name: 'n8n',
    description: 'Orquestração de automações e webhooks entre sistemas.',
    status: 'connected',
    category: 'Automação',
    lastCheckedAt: '2026-05-14T08:55:00Z',
  },
  {
    id: 'int-fathom',
    name: 'Fathom Analytics',
    description: 'Análise de tráfego web sem cookies — RGPD compliant.',
    status: 'connected',
    category: 'Analítica',
    lastCheckedAt: '2026-05-14T09:00:00Z',
  },
  {
    id: 'int-openai',
    name: 'OpenAI',
    description: 'Motor de IA para assistente de vendas, resumos e sugestões de preço.',
    status: 'connected',
    category: 'IA',
    lastCheckedAt: '2026-05-14T09:01:00Z',
  },
  {
    id: 'int-google-places',
    name: 'Google Places',
    description: 'Validação e enriquecimento de moradas de clientes.',
    status: 'error',
    category: 'Enriquecimento',
    lastCheckedAt: '2026-05-14T08:00:00Z',
  },
  {
    id: 'int-alibaba',
    name: 'Alibaba / 1688',
    description: 'Importação de orçamentos e encomendas de fornecedores.',
    status: 'connected',
    category: 'Fornecedores',
    lastCheckedAt: '2026-05-14T06:00:00Z',
  },
  {
    id: 'int-supabase',
    name: 'Supabase',
    description: 'Base de dados, autenticação e armazenamento de ficheiros.',
    status: 'connected',
    category: 'Infraestrutura',
    lastCheckedAt: '2026-05-14T09:01:00Z',
  },
];

export const mockAuditLog: AuditEntry[] = [
  {
    id: 'aud-001',
    who: 'Tiago Sousa',
    action: 'UPDATE',
    entity: 'PriceList',
    entityId: 'pl-002',
    when: '2026-05-14T09:10:00Z',
    ip: '195.22.11.4',
  },
  {
    id: 'aud-002',
    who: 'Ana Santos',
    action: 'CREATE',
    entity: 'CustomerOrder',
    entityId: 'ord-1872',
    when: '2026-05-14T08:48:00Z',
    ip: '185.44.10.1',
  },
  {
    id: 'aud-003',
    who: 'Bruno Ferreira',
    action: 'UPDATE',
    entity: 'Customer',
    entityId: 'cust-0091',
    when: '2026-05-14T08:31:00Z',
    ip: '192.168.1.2',
  },
  {
    id: 'aud-004',
    who: 'Catarina Lopes',
    action: 'CREATE',
    entity: 'Visit',
    entityId: 'vis-0441',
    when: '2026-05-13T17:22:00Z',
    ip: '10.0.1.5',
  },
  {
    id: 'aud-005',
    who: 'Tiago Sousa',
    action: 'DELETE',
    entity: 'Product',
    entityId: 'sku-BUN-002',
    when: '2026-05-13T16:55:00Z',
    ip: '195.22.11.4',
  },
  {
    id: 'aud-006',
    who: 'Ana Santos',
    action: 'UPDATE',
    entity: 'CustomerOrder',
    entityId: 'ord-1869',
    when: '2026-05-13T16:10:00Z',
    ip: '185.44.10.1',
  },
  {
    id: 'aud-007',
    who: 'Diogo Martins',
    action: 'UPDATE',
    entity: 'StockMovement',
    entityId: 'stk-0812',
    when: '2026-05-13T14:30:00Z',
    ip: '192.168.1.7',
  },
  {
    id: 'aud-008',
    who: 'Bruno Ferreira',
    action: 'CREATE',
    entity: 'CustomerLead',
    entityId: 'lead-0189',
    when: '2026-05-13T13:45:00Z',
    ip: '192.168.1.2',
  },
  {
    id: 'aud-009',
    who: 'Tiago Sousa',
    action: 'UPDATE',
    entity: 'OrgSettings',
    entityId: 'org-001',
    when: '2026-05-13T11:00:00Z',
    ip: '195.22.11.4',
  },
  {
    id: 'aud-010',
    who: 'Ana Santos',
    action: 'INVITE',
    entity: 'User',
    entityId: 'u-pending-1',
    when: '2026-05-12T15:20:00Z',
    ip: '185.44.10.1',
  },
  {
    id: 'aud-011',
    who: 'Catarina Lopes',
    action: 'UPDATE',
    entity: 'CustomerOrder',
    entityId: 'ord-1854',
    when: '2026-05-12T14:00:00Z',
    ip: '10.0.1.5',
  },
  {
    id: 'aud-012',
    who: 'Diogo Martins',
    action: 'CREATE',
    entity: 'StockMovement',
    entityId: 'stk-0811',
    when: '2026-05-12T09:15:00Z',
    ip: '192.168.1.7',
  },
  {
    id: 'aud-013',
    who: 'Tiago Sousa',
    action: 'UPDATE',
    entity: 'PriceList',
    entityId: 'pl-001',
    when: '2026-05-11T17:40:00Z',
    ip: '195.22.11.4',
  },
  {
    id: 'aud-014',
    who: 'Bruno Ferreira',
    action: 'UPDATE',
    entity: 'Customer',
    entityId: 'cust-0044',
    when: '2026-05-11T16:20:00Z',
    ip: '192.168.1.2',
  },
  {
    id: 'aud-015',
    who: 'Ana Santos',
    action: 'CLOSE_MONTH',
    entity: 'CommissionStatement',
    entityId: 'cs-2026-04',
    when: '2026-05-10T10:05:00Z',
    ip: '185.44.10.1',
  },
];
