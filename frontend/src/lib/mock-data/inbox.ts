/**
 * Dados mock para o módulo Inbox (WhatsApp + Email).
 */

export type MessageChannel = 'whatsapp' | 'email';
export type MessageDirection = 'in' | 'out';

export interface MockMessage {
  id: string;
  body: string;
  direction: MessageDirection;
  sentAt: string;
  channel: MessageChannel;
}

export interface MockThread {
  id: string;
  customerName: string;
  channel: MessageChannel;
  lastMessageAt: string;
  unreadCount: number;
  messages: MockMessage[];
}

// ---------------------------------------------------------------------------
// Helpers de data (relativos a 2026-05-13)
// ---------------------------------------------------------------------------
function daysAgo(d: number, h = 0, m = 0): string {
  const dt = new Date('2026-05-13T12:00:00Z');
  dt.setDate(dt.getDate() - d);
  dt.setHours(h, m, 0, 0);
  return dt.toISOString();
}

// ---------------------------------------------------------------------------
// Threads
// ---------------------------------------------------------------------------
export const mockThreads: MockThread[] = [
  // --- 1. WhatsApp – pedido de preços (lida)
  {
    id: 'THR-001',
    customerName: 'Floricultura Lurdes',
    channel: 'whatsapp',
    lastMessageAt: daysAgo(0, 9, 15),
    unreadCount: 0,
    messages: [
      {
        id: 'MSG-001-01',
        body: 'Bom dia! Precisava de saber o preço da Lagurus Ovatus embalagem de 100 unidades.',
        direction: 'in',
        sentAt: daysAgo(2, 9, 0),
        channel: 'whatsapp',
      },
      {
        id: 'MSG-001-02',
        body: 'Bom dia, Lurdes! A caixa de 100 un. sai a €14,50. Temos stock disponível esta semana.',
        direction: 'out',
        sentAt: daysAgo(2, 9, 30),
        channel: 'whatsapp',
      },
      {
        id: 'MSG-001-03',
        body: 'Ótimo! E a Phalaris em bunchão?',
        direction: 'in',
        sentAt: daysAgo(2, 9, 45),
        channel: 'whatsapp',
      },
      {
        id: 'MSG-001-04',
        body: 'Phalaris a €8,20 por molho de 10. Mínimo 5 molhos por encomenda.',
        direction: 'out',
        sentAt: daysAgo(2, 10, 0),
        channel: 'whatsapp',
      },
      {
        id: 'MSG-001-05',
        body: 'Perfeito, então quero 3 caixas Lagurus + 10 molhos Phalaris. Como faço a encomenda?',
        direction: 'in',
        sentAt: daysAgo(1, 15, 20),
        channel: 'whatsapp',
      },
      {
        id: 'MSG-001-06',
        body: 'Pode confirmar por aqui e eu lanço a encomenda. Total estimado: €125,50 + IVA.',
        direction: 'out',
        sentAt: daysAgo(1, 15, 45),
        channel: 'whatsapp',
      },
      {
        id: 'MSG-001-07',
        body: 'Confirmado! Muito obrigada.',
        direction: 'in',
        sentAt: daysAgo(0, 9, 15),
        channel: 'whatsapp',
      },
    ],
  },

  // --- 2. WhatsApp – reclamação produto danificado (não lida)
  {
    id: 'THR-002',
    customerName: 'Verde Naranja Madrid',
    channel: 'whatsapp',
    lastMessageAt: daysAgo(0, 8, 50),
    unreadCount: 3,
    messages: [
      {
        id: 'MSG-002-01',
        body: 'Hola, recibimos el pedido ORD-2026-0312 pero hay 2 cajas de Gypsophila aplastadas.',
        direction: 'in',
        sentAt: daysAgo(1, 16, 0),
        channel: 'whatsapp',
      },
      {
        id: 'MSG-002-02',
        body: 'Lamentamos muito o sucedido. Pode enviar fotos do dano, por favor?',
        direction: 'out',
        sentAt: daysAgo(1, 16, 30),
        channel: 'whatsapp',
      },
      {
        id: 'MSG-002-03',
        body: '[foto] Aquí están las fotos. Está completamente aplastada.',
        direction: 'in',
        sentAt: daysAgo(1, 16, 45),
        channel: 'whatsapp',
      },
      {
        id: 'MSG-002-04',
        body: 'Vamos processar a devolução e enviar substituição amanhã. Pedimos desculpa.',
        direction: 'out',
        sentAt: daysAgo(1, 17, 0),
        channel: 'whatsapp',
      },
      {
        id: 'MSG-002-05',
        body: 'Gracias. ¿Cuándo llega la sustitución exactamente?',
        direction: 'in',
        sentAt: daysAgo(0, 8, 0),
        channel: 'whatsapp',
      },
      {
        id: 'MSG-002-06',
        body: 'El transportista confirma el jueves antes de las 13h. ¿Le va bien?',
        direction: 'in',
        sentAt: daysAgo(0, 8, 30),
        channel: 'whatsapp',
      },
      {
        id: 'MSG-002-07',
        body: 'Quinta está bem. Por favor confirmar tracking.',
        direction: 'in',
        sentAt: daysAgo(0, 8, 50),
        channel: 'whatsapp',
      },
    ],
  },

  // --- 3. WhatsApp – encomenda confirmada (lida)
  {
    id: 'THR-003',
    customerName: 'Atelier Flora Coimbra',
    channel: 'whatsapp',
    lastMessageAt: daysAgo(1, 14, 0),
    unreadCount: 0,
    messages: [
      {
        id: 'MSG-003-01',
        body: 'Boa tarde! Quero confirmar a encomenda ORD-2026-0298. Está tudo correto?',
        direction: 'in',
        sentAt: daysAgo(3, 14, 0),
        channel: 'whatsapp',
      },
      {
        id: 'MSG-003-02',
        body: 'Sim, confirmo! 4 cx Statice azul, 2 cx Ammobium, total €87,40 + IVA. Expedição sexta.',
        direction: 'out',
        sentAt: daysAgo(3, 14, 20),
        channel: 'whatsapp',
      },
      {
        id: 'MSG-003-03',
        body: 'Excelente! Transferência já foi feita. Obrigada.',
        direction: 'in',
        sentAt: daysAgo(3, 15, 0),
        channel: 'whatsapp',
      },
      {
        id: 'MSG-003-04',
        body: 'Recebido, obrigado! Envio confirmação de expedição na sexta.',
        direction: 'out',
        sentAt: daysAgo(3, 15, 10),
        channel: 'whatsapp',
      },
      {
        id: 'MSG-003-05',
        body: 'Pedido ORD-2026-0298 expedido. Tracking: DPD-PT-88812345. Entrega prevista amanhã.',
        direction: 'out',
        sentAt: daysAgo(1, 14, 0),
        channel: 'whatsapp',
      },
    ],
  },

  // --- 4. Email – pedido de catálogo (lida)
  {
    id: 'THR-004',
    customerName: 'Daisy Florist Porto',
    channel: 'email',
    lastMessageAt: daysAgo(2, 11, 0),
    unreadCount: 0,
    messages: [
      {
        id: 'MSG-004-01',
        body: 'Bom dia, gostaria de receber o catálogo de primavera 2026 e lista de preços atualizada.',
        direction: 'in',
        sentAt: daysAgo(5, 9, 0),
        channel: 'email',
      },
      {
        id: 'MSG-004-02',
        body: 'Bom dia! Segue em anexo o catálogo primavera 2026 e a lista de preços. Qualquer dúvida, estamos à disposição.',
        direction: 'out',
        sentAt: daysAgo(5, 11, 0),
        channel: 'email',
      },
      {
        id: 'MSG-004-03',
        body: 'Muito obrigada! Vou analisar e entro em contacto brevemente com a encomenda.',
        direction: 'in',
        sentAt: daysAgo(2, 11, 0),
        channel: 'email',
      },
    ],
  },

  // --- 5. WhatsApp – agendamento de entrega (não lida)
  {
    id: 'THR-005',
    customerName: 'Bouquet Lisboa',
    channel: 'whatsapp',
    lastMessageAt: daysAgo(0, 10, 30),
    unreadCount: 2,
    messages: [
      {
        id: 'MSG-005-01',
        body: 'Olá! A entrega da próxima semana pode ser na terça de manhã? Antes das 11h de preferência.',
        direction: 'in',
        sentAt: daysAgo(0, 9, 45),
        channel: 'whatsapp',
      },
      {
        id: 'MSG-005-02',
        body: 'Boa tarde! Podemos confirmar terça entre 9h-11h. Precisa de carraça na morada antiga?',
        direction: 'out',
        sentAt: daysAgo(0, 10, 0),
        channel: 'whatsapp',
      },
      {
        id: 'MSG-005-03',
        body: 'Não, pode ser na nova morada: Av. Almirante Reis 204, 1000-043 Lisboa.',
        direction: 'in',
        sentAt: daysAgo(0, 10, 15),
        channel: 'whatsapp',
      },
      {
        id: 'MSG-005-04',
        body: 'Ok, atualizado! E alguém estará lá para receber?',
        direction: 'in',
        sentAt: daysAgo(0, 10, 30),
        channel: 'whatsapp',
      },
    ],
  },

  // --- 6. Email – negociação de desconto (não lida)
  {
    id: 'THR-006',
    customerName: 'Flors Barcelona',
    channel: 'email',
    lastMessageAt: daysAgo(0, 7, 20),
    unreadCount: 1,
    messages: [
      {
        id: 'MSG-006-01',
        body: 'Buenos días. Llevamos 3 años trabajando juntos y me gustaría revisar las condiciones comerciales para este año.',
        direction: 'in',
        sentAt: daysAgo(7, 9, 0),
        channel: 'email',
      },
      {
        id: 'MSG-006-02',
        body: 'Buenos días! Claro, vamos a revisar. Actualmente tiene un 5% de descuento en pedidos +€500. ¿Qué propone?',
        direction: 'out',
        sentAt: daysAgo(6, 10, 0),
        channel: 'email',
      },
      {
        id: 'MSG-006-03',
        body: 'Me gustaría un 8% dado el volumen anual. Hemos comprado +€18.000 el año pasado.',
        direction: 'in',
        sentAt: daysAgo(5, 11, 30),
        channel: 'email',
      },
      {
        id: 'MSG-006-04',
        body: 'Vou consultar internamente e dar resposta até final da semana. Obrigado pela sua fidelidade!',
        direction: 'out',
        sentAt: daysAgo(4, 9, 0),
        channel: 'email',
      },
      {
        id: 'MSG-006-05',
        body: 'Perfecto, espero su respuesta. Un saludo.',
        direction: 'in',
        sentAt: daysAgo(0, 7, 20),
        channel: 'email',
      },
    ],
  },

  // --- 7. WhatsApp – nutrição de lead (não lida)
  {
    id: 'THR-007',
    customerName: 'Jardim Secreto Braga',
    channel: 'whatsapp',
    lastMessageAt: daysAgo(0, 11, 0),
    unreadCount: 1,
    messages: [
      {
        id: 'MSG-007-01',
        body: 'Olá! Vi o vosso stand na Expoflora e fiquei interessado. Trabalham com floristas pequenos?',
        direction: 'in',
        sentAt: daysAgo(14, 16, 0),
        channel: 'whatsapp',
      },
      {
        id: 'MSG-007-02',
        body: 'Claro que sim! Não temos mínimo de entrada. Posso enviar-lhe o nosso catálogo e lista de preços?',
        direction: 'out',
        sentAt: daysAgo(14, 16, 30),
        channel: 'whatsapp',
      },
      {
        id: 'MSG-007-03',
        body: 'Sim, por favor! E têm flores secas portuguesas?',
        direction: 'in',
        sentAt: daysAgo(13, 9, 0),
        channel: 'whatsapp',
      },
      {
        id: 'MSG-007-04',
        body: 'Temos Limonium e Lavanda de Portugal. Envio catálogo já. Tem interesse numa amostra grátis?',
        direction: 'out',
        sentAt: daysAgo(13, 10, 0),
        channel: 'whatsapp',
      },
      {
        id: 'MSG-007-05',
        body: 'Sim, adorava experimentar! Como funciona?',
        direction: 'in',
        sentAt: daysAgo(12, 14, 0),
        channel: 'whatsapp',
      },
      {
        id: 'MSG-007-06',
        body: 'Enviamos uma caixa de amostras sem custo (portes por conta do cliente). Confirma morada?',
        direction: 'out',
        sentAt: daysAgo(12, 14, 30),
        channel: 'whatsapp',
      },
      {
        id: 'MSG-007-07',
        body: 'Rua do Souto 45, 4710-320 Braga. Quando chegam as amostras?',
        direction: 'in',
        sentAt: daysAgo(12, 15, 0),
        channel: 'whatsapp',
      },
      {
        id: 'MSG-007-08',
        body: 'Expedição esta semana, entrega até sexta. Vamos acompanhar?',
        direction: 'out',
        sentAt: daysAgo(11, 9, 0),
        channel: 'whatsapp',
      },
      {
        id: 'MSG-007-09',
        body: 'Chegaram as amostras hoje. Estão lindas! Quando posso fazer a primeira encomenda?',
        direction: 'in',
        sentAt: daysAgo(0, 11, 0),
        channel: 'whatsapp',
      },
    ],
  },

  // --- 8. WhatsApp – atualização de stock (lida)
  {
    id: 'THR-008',
    customerName: 'Rosas & Rosas Setúbal',
    channel: 'whatsapp',
    lastMessageAt: daysAgo(3, 16, 0),
    unreadCount: 0,
    messages: [
      {
        id: 'MSG-008-01',
        body: 'Boa tarde! Ainda têm Pampas Grass disponível? Precisava de 20 unidades para um casamento.',
        direction: 'in',
        sentAt: daysAgo(5, 15, 0),
        channel: 'whatsapp',
      },
      {
        id: 'MSG-008-02',
        body: 'Boa tarde! Temos 35 unidades em stock. Quer reservar já?',
        direction: 'out',
        sentAt: daysAgo(5, 15, 20),
        channel: 'whatsapp',
      },
      {
        id: 'MSG-008-03',
        body: 'Sim! Reserve 20. Para quando conseguem entregar?',
        direction: 'in',
        sentAt: daysAgo(5, 15, 30),
        channel: 'whatsapp',
      },
      {
        id: 'MSG-008-04',
        body: 'Quinta ou sexta desta semana. Qual prefere?',
        direction: 'out',
        sentAt: daysAgo(5, 15, 40),
        channel: 'whatsapp',
      },
      {
        id: 'MSG-008-05',
        body: 'Quinta por favor!',
        direction: 'in',
        sentAt: daysAgo(5, 15, 45),
        channel: 'whatsapp',
      },
      {
        id: 'MSG-008-06',
        body: 'Confirmado! Reserva feita. Encomenda ORD-2026-0315 criada. Total: €74,00 + IVA.',
        direction: 'out',
        sentAt: daysAgo(5, 16, 0),
        channel: 'whatsapp',
      },
      {
        id: 'MSG-008-07',
        body: 'Perfeito, obrigada!',
        direction: 'in',
        sentAt: daysAgo(4, 9, 0),
        channel: 'whatsapp',
      },
      {
        id: 'MSG-008-08',
        body: 'Pampas Grass expedido hoje. Tracking: GLS-PT-55598721.',
        direction: 'out',
        sentAt: daysAgo(3, 16, 0),
        channel: 'whatsapp',
      },
    ],
  },

  // --- 9. Email – fatura em atraso (lida)
  {
    id: 'THR-009',
    customerName: 'Primavera Decorações Évora',
    channel: 'email',
    lastMessageAt: daysAgo(6, 9, 0),
    unreadCount: 0,
    messages: [
      {
        id: 'MSG-009-01',
        body: 'Bom dia. Verificamos que a fatura FAT-2026-0187 de €234,60 está por liquidar (vencimento 30 abril). Pode confirmar?',
        direction: 'out',
        sentAt: daysAgo(10, 9, 0),
        channel: 'email',
      },
      {
        id: 'MSG-009-02',
        body: 'Peço desculpa, houve um problema interno. Transfiro hoje.',
        direction: 'in',
        sentAt: daysAgo(9, 14, 0),
        channel: 'email',
      },
      {
        id: 'MSG-009-03',
        body: 'Pagamento recebido. Obrigado! Fatura liquidada.',
        direction: 'out',
        sentAt: daysAgo(6, 9, 0),
        channel: 'email',
      },
    ],
  },

  // --- 10. WhatsApp – nova coleção verão (lida)
  {
    id: 'THR-010',
    customerName: 'Fleur de Lis Cascais',
    channel: 'whatsapp',
    lastMessageAt: daysAgo(4, 12, 30),
    unreadCount: 0,
    messages: [
      {
        id: 'MSG-010-01',
        body: 'Bom dia! Ouvi falar que têm uma nova coleção de verão. Posso ver?',
        direction: 'in',
        sentAt: daysAgo(6, 10, 0),
        channel: 'whatsapp',
      },
      {
        id: 'MSG-010-02',
        body: 'Sim! Acabámos de receber Ruscus tingido, Leucadendron e novos tons de Helychrisum. Envio fichas técnicas.',
        direction: 'out',
        sentAt: daysAgo(6, 10, 30),
        channel: 'whatsapp',
      },
      {
        id: 'MSG-010-03',
        body: 'Que cores têm no Helychrisum?',
        direction: 'in',
        sentAt: daysAgo(5, 15, 0),
        channel: 'whatsapp',
      },
      {
        id: 'MSG-010-04',
        body: 'Amarelo ouro, laranja, rosa-chiclete e branco. Mínimo 5 molhos por cor.',
        direction: 'out',
        sentAt: daysAgo(5, 15, 30),
        channel: 'whatsapp',
      },
      {
        id: 'MSG-010-05',
        body: 'Quero 5 molhos de cada cor + 2 cx Leucadendron. Faz encomenda?',
        direction: 'in',
        sentAt: daysAgo(4, 12, 0),
        channel: 'whatsapp',
      },
      {
        id: 'MSG-010-06',
        body: 'ORD-2026-0321 criada. Total: €142,80 + IVA. Expedição amanhã.',
        direction: 'out',
        sentAt: daysAgo(4, 12, 30),
        channel: 'whatsapp',
      },
    ],
  },

  // --- 11. Email – pedido de visita comercial (lida)
  {
    id: 'THR-011',
    customerName: 'Florama Viseu',
    channel: 'email',
    lastMessageAt: daysAgo(8, 16, 0),
    unreadCount: 0,
    messages: [
      {
        id: 'MSG-011-01',
        body: 'Boa tarde, gostaríamos de agendar uma visita do vosso comercial para conhecer melhor o vosso portefólio.',
        direction: 'in',
        sentAt: daysAgo(12, 15, 0),
        channel: 'email',
      },
      {
        id: 'MSG-011-02',
        body: 'Com muito gosto! O nosso comercial Pedro Silva pode visitar na semana de 20 de maio. Tem disponibilidade?',
        direction: 'out',
        sentAt: daysAgo(11, 9, 0),
        channel: 'email',
      },
      {
        id: 'MSG-011-03',
        body: 'Sim, dia 21 de maio às 10h seria perfeito.',
        direction: 'in',
        sentAt: daysAgo(10, 11, 0),
        channel: 'email',
      },
      {
        id: 'MSG-011-04',
        body: 'Agendado! Pedro Silva visita-os no dia 21/05 às 10h. Enviaremos confirmação no dia anterior.',
        direction: 'out',
        sentAt: daysAgo(8, 16, 0),
        channel: 'email',
      },
    ],
  },

  // --- 12. WhatsApp – reclamação prazo de entrega (lida)
  {
    id: 'THR-012',
    customerName: 'Botânica Faro',
    channel: 'whatsapp',
    lastMessageAt: daysAgo(7, 17, 0),
    unreadCount: 0,
    messages: [
      {
        id: 'MSG-012-01',
        body: 'Boa tarde! A encomenda ORD-2026-0288 devia ter chegado ontem e ainda não temos nada. Podem verificar?',
        direction: 'in',
        sentAt: daysAgo(9, 16, 0),
        channel: 'whatsapp',
      },
      {
        id: 'MSG-012-02',
        body: 'Pedimos desculpa pelo atraso. Estamos a verificar com a transportadora. Dou-lhe feedback em 30 minutos.',
        direction: 'out',
        sentAt: daysAgo(9, 16, 15),
        channel: 'whatsapp',
      },
      {
        id: 'MSG-012-03',
        body: 'A transportadora confirma atraso por greve regional. Entrega amanhã de manhã, garantido.',
        direction: 'out',
        sentAt: daysAgo(9, 16, 50),
        channel: 'whatsapp',
      },
      {
        id: 'MSG-012-04',
        body: 'Ok, percebo. Mas é complicado, tinha uma entrega marcada para hoje com a minha cliente.',
        direction: 'in',
        sentAt: daysAgo(9, 17, 0),
        channel: 'whatsapp',
      },
      {
        id: 'MSG-012-05',
        body: 'Pedimos desculpa. Vamos oferecer desconto de 10% na próxima encomenda como compensação.',
        direction: 'out',
        sentAt: daysAgo(9, 17, 20),
        channel: 'whatsapp',
      },
      {
        id: 'MSG-012-06',
        body: 'Ok, obrigada. Esperamos que não se repita.',
        direction: 'in',
        sentAt: daysAgo(8, 9, 0),
        channel: 'whatsapp',
      },
      {
        id: 'MSG-012-07',
        body: 'Encomenda entregue! Confirmação: GLS-PT-44492011. Bom trabalho!',
        direction: 'out',
        sentAt: daysAgo(7, 17, 0),
        channel: 'whatsapp',
      },
    ],
  },
];
