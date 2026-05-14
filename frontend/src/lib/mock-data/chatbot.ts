/**
 * Mock data para o chatbot RAG (§10.8).
 */

export type MessageRole = 'user' | 'assistant';

export type ToolCallStatus = 'running' | 'done';

export interface ToolCall {
  id: string;
  name: string;
  input: Record<string, unknown>;
  output?: unknown;
  status: ToolCallStatus;
}

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  toolCall?: ToolCall;
  isDraft?: boolean;
  draftConfirmed?: boolean | null; // null = pendente
  timestamp: string;
}

export interface ChatConversation {
  id: string;
  title: string;
  startedAt: string;
  messages: ChatMessage[];
}

export const mockChatConversations: ChatConversation[] = [
  {
    id: 'conv-001',
    title: 'Pesquisa limonium + orçamento Flores do Tejo',
    startedAt: '2026-05-13T09:15:00Z',
    messages: [
      {
        id: 'msg-001',
        role: 'user',
        content: 'Mostra-me os produtos de limonium disponíveis.',
        timestamp: '2026-05-13T09:15:10Z',
      },
      {
        id: 'msg-002',
        role: 'assistant',
        content: 'Vou pesquisar os produtos de limonium no catálogo.',
        timestamp: '2026-05-13T09:15:12Z',
        toolCall: {
          id: 'tc-001',
          name: 'searchProducts',
          input: { query: 'limonium', inStock: true },
          output: [
            { sku: 'LIM-001', name: 'Limonium sinuatum azul', stock: 240, priceEur: 3.5 },
            { sku: 'LIM-002', name: 'Limonium sinuatum branco', stock: 180, priceEur: 3.5 },
            { sku: 'LIM-003', name: 'Limonium perezii', stock: 60, priceEur: 4.2 },
          ],
          status: 'done',
        },
      },
      {
        id: 'msg-003',
        role: 'assistant',
        content:
          'Encontrei 3 referências de limonium em stock:\n\n- **LIM-001** Limonium sinuatum azul — 240 un. @ €3,50\n- **LIM-002** Limonium sinuatum branco — 180 un. @ €3,50\n- **LIM-003** Limonium perezii — 60 un. @ €4,20\n\nPretende criar um orçamento para algum cliente?',
        timestamp: '2026-05-13T09:15:14Z',
      },
      {
        id: 'msg-004',
        role: 'user',
        content: 'Sim, faz um orçamento para Flores do Tejo com 50 un. de cada azul e branco.',
        timestamp: '2026-05-13T09:16:00Z',
      },
      {
        id: 'msg-005',
        role: 'assistant',
        content: 'A preparar orçamento para Flores do Tejo…',
        timestamp: '2026-05-13T09:16:02Z',
        toolCall: {
          id: 'tc-002',
          name: 'draftQuoteForCustomer',
          input: {
            customerName: 'Flores do Tejo',
            lines: [
              { sku: 'LIM-001', qty: 50 },
              { sku: 'LIM-002', qty: 50 },
            ],
          },
          output: { draftId: 'DRF-2026-0089', totalEur: 350.0 },
          status: 'done',
        },
        isDraft: true,
        draftConfirmed: null,
      },
      {
        id: 'msg-006',
        role: 'assistant',
        content:
          'Orçamento DRF-2026-0089 preparado para Flores do Tejo — total **€350,00**.\nRequer confirmação antes de ser enviado.',
        timestamp: '2026-05-13T09:16:04Z',
      },
      {
        id: 'msg-007',
        role: 'user',
        content: 'Qual o prazo de validade do stock de limonium perezii?',
        timestamp: '2026-05-13T09:17:30Z',
      },
      {
        id: 'msg-008',
        role: 'assistant',
        content: 'A consultar informação do lote…',
        timestamp: '2026-05-13T09:17:31Z',
        toolCall: {
          id: 'tc-003',
          name: 'getProductBatch',
          input: { sku: 'LIM-003' },
          output: { batchOriginDate: '2025-11-01', shelfLifeMonths: 18, expiresAt: '2027-05-01' },
          status: 'done',
        },
      },
      {
        id: 'msg-009',
        role: 'assistant',
        content:
          'O Limonium perezii (LIM-003) tem lote de Novembro 2025, com vida útil de 18 meses. Validade até **Maio 2027**.',
        timestamp: '2026-05-13T09:17:33Z',
      },
      {
        id: 'msg-010',
        role: 'user',
        content: 'Obrigado.',
        timestamp: '2026-05-13T09:18:00Z',
      },
      {
        id: 'msg-011',
        role: 'assistant',
        content: 'De nada! Se precisar de mais alguma coisa, estou disponível.',
        timestamp: '2026-05-13T09:18:02Z',
      },
    ],
  },
  {
    id: 'conv-002',
    title: 'Clientes em atraso — relatório',
    startedAt: '2026-05-12T14:00:00Z',
    messages: [
      {
        id: 'msg-c2-001',
        role: 'user',
        content: 'Lista os clientes com pagamentos em atraso.',
        timestamp: '2026-05-12T14:00:05Z',
      },
      {
        id: 'msg-c2-002',
        role: 'assistant',
        content: 'A pesquisar clientes com pagamentos vencidos…',
        timestamp: '2026-05-12T14:00:07Z',
        toolCall: {
          id: 'tc-c2-001',
          name: 'listOverdueCustomers',
          input: { overdueDays: 30 },
          output: [
            { customerName: 'Jardim das Flores', overdueEur: 820.0, daysOverdue: 45 },
            { customerName: 'Rosa & Cravos', overdueEur: 310.5, daysOverdue: 32 },
          ],
          status: 'done',
        },
      },
      {
        id: 'msg-c2-003',
        role: 'assistant',
        content:
          '2 clientes com pagamentos em atraso (>30 dias):\n\n- **Jardim das Flores** — €820,00 (45 dias)\n- **Rosa & Cravos** — €310,50 (32 dias)\n\nPretende enviar um lembrete?',
        timestamp: '2026-05-12T14:00:10Z',
      },
    ],
  },
  {
    id: 'conv-003',
    title: 'Stock mínimo gypsophila',
    startedAt: '2026-05-10T10:30:00Z',
    messages: [
      {
        id: 'msg-c3-001',
        role: 'user',
        content: 'Qual o stock actual de gypsophila?',
        timestamp: '2026-05-10T10:30:08Z',
      },
      {
        id: 'msg-c3-002',
        role: 'assistant',
        content: 'A verificar stock…',
        timestamp: '2026-05-10T10:30:10Z',
        toolCall: {
          id: 'tc-c3-001',
          name: 'searchProducts',
          input: { query: 'gypsophila' },
          output: [{ sku: 'GYP-001', name: 'Gypsophila branca seca', stock: 12, priceEur: 5.8 }],
          status: 'done',
        },
      },
      {
        id: 'msg-c3-003',
        role: 'assistant',
        content:
          'Stock actual de Gypsophila branca seca (GYP-001): **12 unidades**. Abaixo do mínimo recomendado de 50 un. Sugiro criar encomenda Alibaba.',
        timestamp: '2026-05-10T10:30:12Z',
      },
    ],
  },
  {
    id: 'conv-004',
    title: 'Preços campanha Verão 2026',
    startedAt: '2026-05-08T16:45:00Z',
    messages: [
      {
        id: 'msg-c4-001',
        role: 'user',
        content: 'Qual o preço mínimo que posso cobrar pelo LIM-001 com desconto de campanha?',
        timestamp: '2026-05-08T16:45:10Z',
      },
      {
        id: 'msg-c4-002',
        role: 'assistant',
        content:
          'O custo de landing do LIM-001 é €2,10/un. O preço mínimo é landed cost × 1,10 = **€2,31/un.** Cobrar abaixo deste valor levanta `ValidationError("PRICE_BELOW_FLOOR")`.',
        timestamp: '2026-05-08T16:45:14Z',
      },
    ],
  },
  {
    id: 'conv-005',
    title: 'Reunião Jardim das Flores — prep.',
    startedAt: '2026-05-07T09:00:00Z',
    messages: [
      {
        id: 'msg-c5-001',
        role: 'user',
        content: 'Resume o histórico de compras de Jardim das Flores.',
        timestamp: '2026-05-07T09:00:15Z',
      },
      {
        id: 'msg-c5-002',
        role: 'assistant',
        content:
          'Jardim das Flores é cliente desde 2023. Nos últimos 12 meses efetuou 18 encomendas totalizando €14.320,00. Categorias principais: flores secas (62%), flores preservadas (28%), acessórios (10%). Última encomenda: 28 Abr 2026.',
        timestamp: '2026-05-07T09:00:18Z',
      },
    ],
  },
  {
    id: 'conv-006',
    title: 'Leads gerados — semana passada',
    startedAt: '2026-05-05T11:00:00Z',
    messages: [
      {
        id: 'msg-c6-001',
        role: 'user',
        content: 'Quantos leads foram gerados esta semana pelo scraping?',
        timestamp: '2026-05-05T11:00:10Z',
      },
      {
        id: 'msg-c6-002',
        role: 'assistant',
        content:
          'Esta semana o módulo de scraping gerou **23 leads** via Google Places (florists em Lisboa e Porto). 8 já foram qualificados como `CustomerLead` activos.',
        timestamp: '2026-05-05T11:00:13Z',
      },
    ],
  },
];
