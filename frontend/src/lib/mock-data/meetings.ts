/**
 * Mock data para Reuniões / Fathom (§10.6).
 */

export interface Meeting {
  id: string;
  title: string;
  customerName?: string;
  date: string;
  durationMin: number;
  summary: string;
  actionItems: string[];
  tags: string[];
  recordingUrl: string;
}

export const mockMeetings: Meeting[] = [
  {
    id: 'meet-001',
    title: 'Revisão de conta — Flores do Tejo',
    customerName: 'Flores do Tejo',
    date: '2026-05-13T10:00:00Z',
    durationMin: 42,
    summary:
      'Reunião de revisão trimestral com Flores do Tejo. Foram discutidos os volumes de compra do 1.º trimestre e as expectativas para o Verão. O cliente manifestou interesse em alargar a gama de flores preservadas. Abordou-se a possibilidade de um desconto escalonado para encomendas acima de €2.000/mês. Ficou acordado o envio de uma proposta de preços atualizada até sexta-feira.',
    actionItems: [
      'Enviar proposta de preços escalonados até 17 Mai',
      'Preparar catálogo de flores preservadas Verão 2026',
      'Agendar follow-up em 3 semanas',
    ],
    tags: ['revisão-conta', 'preços', 'flores-preservadas'],
    recordingUrl: 'https://fathom.video/call/mock-001',
  },
  {
    id: 'meet-002',
    title: 'Onboarding — Jardim Secreto',
    customerName: 'Jardim Secreto',
    date: '2026-05-12T14:30:00Z',
    durationMin: 28,
    summary:
      'Primeira reunião com a nova florista Jardim Secreto, sediada no Porto. A cliente tem loja física e vende online via Instagram. Interesse declarado em gypsophila e lagurus. Explicou-se o processo de encomenda, prazos de entrega e política de devoluções. A cliente ficou satisfeita com o prazo de 2-3 dias úteis para o Norte.',
    actionItems: [
      'Criar conta de cliente no CRM',
      'Enviar catálogo de boas-vindas por email',
      'Oferecer desconto de 5% na primeira encomenda',
    ],
    tags: ['onboarding', 'novo-cliente', 'porto'],
    recordingUrl: 'https://fathom.video/call/mock-002',
  },
  {
    id: 'meet-003',
    title: 'Negociação campanha Dia da Mãe',
    customerName: 'Rosa & Cravos',
    date: '2026-05-10T09:00:00Z',
    durationMin: 55,
    summary:
      'Reunião de preparação para a campanha do Dia da Mãe. Rosa & Cravos pretende fazer uma encomenda especial de 500 unidades de rosas secas em tons pastel. Discutiram-se as condições de pagamento — o cliente solicitou prazo de 60 dias, proposta rejeitada, chegou-se a acordo com 45 dias. O preço unitário acordado é €2,80, com desconto de 8% para esta campanha.',
    actionItems: [
      'Confirmar disponibilidade de stock de rosas pastel',
      'Emitir proposta com prazo de 45 dias',
      'Reservar stock até 15 Mai',
    ],
    tags: ['campanha', 'dia-da-mae', 'negociação'],
    recordingUrl: 'https://fathom.video/call/mock-003',
  },
  {
    id: 'meet-004',
    title: 'Reunião interna — revisão Q1',
    date: '2026-05-08T15:00:00Z',
    durationMin: 70,
    summary:
      'Revisão interna dos resultados do primeiro trimestre de 2026. As vendas cresceram 18% face ao mesmo período de 2025. O produto estrela foi o limonium azul, com 1.200 unidades vendidas. Identificaram-se oportunidades de crescimento no segmento de ateliers de decoração. Planeou-se a participação na feira Iberflora em outubro.',
    actionItems: [
      'Preparar relatório Q1 para gestão',
      'Definir estratégia para segmento ateliers',
      'Inscrever empresa na Iberflora 2026',
      'Rever previsão de stock para Verão',
    ],
    tags: ['interno', 'q1', 'estratégia'],
    recordingUrl: 'https://fathom.video/call/mock-004',
  },
  {
    id: 'meet-005',
    title: 'Apresentação catálogo Outono',
    customerName: 'Atelier Botânico',
    date: '2026-05-06T11:00:00Z',
    durationMin: 35,
    summary:
      'Apresentação do catálogo de Outono/Inverno 2026 ao Atelier Botânico. O cliente mostrou grande interesse nas novas referências de eucalipto preservado e fetos secos. Foi apresentada a nova embalagem ecológica. Ficou de enviar uma encomenda de teste até ao final do mês.',
    actionItems: ['Enviar amostras de eucalipto e fetos', 'Aguardar encomenda de teste até 31 Mai'],
    tags: ['catálogo', 'outono', 'novo-produto'],
    recordingUrl: 'https://fathom.video/call/mock-005',
  },
  {
    id: 'meet-006',
    title: 'Suporte — reclamação entrega',
    customerName: 'Flores & Arte',
    date: '2026-05-05T16:00:00Z',
    durationMin: 22,
    summary:
      'Reunião de resolução de reclamação: a encomenda EC-2026-0311 chegou com 15% de unidades danificadas de gypsophila. A cliente enviou fotos como prova. Acordou-se a reemissão das unidades danificadas sem custo adicional e envio prioritário. A cliente ficou satisfeita com a resolução.',
    actionItems: [
      'Processar devolução parcial EC-2026-0311',
      'Emitir nota de crédito',
      'Verificar embalagem de gypsophila com logística',
    ],
    tags: ['reclamação', 'devolução', 'suporte'],
    recordingUrl: 'https://fathom.video/call/mock-006',
  },
  {
    id: 'meet-007',
    title: 'Parceria — fornecedor Holanda',
    date: '2026-04-30T09:30:00Z',
    durationMin: 90,
    summary:
      'Primeira reunião com potencial fornecedor holandês de flores secas premium. A empresa Van Der Bloom apresentou o catálogo de inverno com exclusividades europeias. Os preços são 12% acima da média Alibaba mas a qualidade e prazo de entrega (7 dias) justificam. Solicitou-se proposta formal e condições de exclusividade para Portugal.',
    actionItems: [
      'Avaliar proposta Van Der Bloom',
      'Calcular margem com preços premium',
      'Decisão até 15 Jun',
    ],
    tags: ['fornecedor', 'holanda', 'parceria'],
    recordingUrl: 'https://fathom.video/call/mock-007',
  },
  {
    id: 'meet-008',
    title: 'Formação equipa — novo CRM',
    date: '2026-04-28T14:00:00Z',
    durationMin: 120,
    summary:
      'Sessão de formação interna sobre as funcionalidades do novo CRM. Foram cobertos os módulos de encomendas, stock e inbox. Os colaboradores levantaram dúvidas sobre o processo de devolução e a integração WhatsApp. Ficou marcada uma segunda sessão para o módulo de relatórios.',
    actionItems: [
      'Preparar guia rápido em PDF',
      'Marcar segunda sessão para módulo relatórios',
      'Documentar FAQs internas',
    ],
    tags: ['formação', 'interno', 'crm'],
    recordingUrl: 'https://fathom.video/call/mock-008',
  },
  {
    id: 'meet-009',
    title: 'Upsell — Viveiro do Norte',
    customerName: 'Viveiro do Norte',
    date: '2026-04-25T10:00:00Z',
    durationMin: 30,
    summary:
      'Reunião de upsell com Viveiro do Norte. O cliente comprava apenas flores secas e foi apresentado o catálogo de acessórios (fitas, suportes, bases). Mostrou interesse em fitas de ráfia e bases de sisal. Ficou de experimentar uma caixa de cada numa encomenda de teste.',
    actionItems: [
      'Incluir amostras de acessórios na próxima encomenda',
      'Enviar lookbook de arranjos com acessórios',
    ],
    tags: ['upsell', 'acessórios', 'cross-sell'],
    recordingUrl: 'https://fathom.video/call/mock-009',
  },
  {
    id: 'meet-010',
    title: 'Revisão preços — lista Primavera',
    date: '2026-04-22T15:30:00Z',
    durationMin: 45,
    summary:
      'Revisão interna da lista de preços de Primavera. Foram ajustadas 23 referências com aumento médio de 3,5% para absorver custos de transporte. As alterações entram em vigor a 1 de Junho. Decidiu-se manter preços actuais para clientes com contrato anual até à renovação.',
    actionItems: [
      'Atualizar lista de preços no CRM',
      'Comunicar alterações a clientes sem contrato',
      'Verificar contratos anuais vigentes',
    ],
    tags: ['preços', 'interno', 'primavera'],
    recordingUrl: 'https://fathom.video/call/mock-010',
  },
  {
    id: 'meet-011',
    title: 'Demo produto — StudioFloral',
    customerName: 'StudioFloral',
    date: '2026-04-18T11:00:00Z',
    durationMin: 38,
    summary:
      'Demonstração de produto ao StudioFloral, um atelier de design floral de Lisboa. A cliente tem interesse em produtos de nicho para projetos de decoração de interiores. Foram apresentadas as coleções de flores secas prensadas e pampas ornamentais. A reunião gerou grande entusiasmo e a cliente pretende criar uma conta.',
    actionItems: [
      'Enviar proposta de conta corporate',
      'Incluir amostras de pampas na encomenda',
      'Follow-up em 1 semana',
    ],
    tags: ['demo', 'novo-cliente', 'design-floral'],
    recordingUrl: 'https://fathom.video/call/mock-011',
  },
  {
    id: 'meet-012',
    title: 'Resolução disputa — pagamento',
    customerName: 'Jardim das Flores',
    date: '2026-04-15T09:00:00Z',
    durationMin: 25,
    summary:
      'Reunião para resolver disputa de pagamento em atraso. Jardim das Flores tem fatura de €820,00 em atraso há 45 dias. O cliente alega problema interno de tesouraria. Chegou-se a acordo de pagamento em 2 prestações: €400 a 20 Mai e €420 a 20 Jun.',
    actionItems: [
      'Registar acordo de pagamento no CRM',
      'Configurar alerta para 20 Mai',
      'Emitir nova fatura com plano de pagamento',
    ],
    tags: ['pagamento', 'atraso', 'disputa'],
    recordingUrl: 'https://fathom.video/call/mock-012',
  },
];
