/**
 * Dados mock para o módulo Rotas.
 */

export type RouteStatus = 'DRAFT' | 'ACTIVE' | 'DONE';

export interface MockStop {
  customerId: string;
  customerName: string;
  city: string;
  sequence: number;
  etaMinutes: number;
  actualMinutes?: number;
}

export interface MockRoute {
  id: string;
  name: string;
  salesRep: string;
  plannedDate: string;
  status: RouteStatus;
  stops: MockStop[];
  totalKm: number;
  totalEtaMinutes: number;
}

export const mockRoutes: MockRoute[] = [
  // ROUTE-2026-W19-001 – Porto Centro - Quinta (ACTIVE)
  {
    id: 'ROUTE-2026-W19-001',
    name: 'Porto Centro – Quinta',
    salesRep: 'Tiago Sousa',
    plannedDate: '2026-05-13',
    status: 'ACTIVE',
    totalKm: 48,
    totalEtaMinutes: 195,
    stops: [
      {
        customerId: 'CUS-101',
        customerName: 'Floricultura Lurdes',
        city: 'Porto',
        sequence: 1,
        etaMinutes: 20,
        actualMinutes: 18,
      },
      {
        customerId: 'CUS-104',
        customerName: 'Daisy Florist Porto',
        city: 'Porto',
        sequence: 2,
        etaMinutes: 25,
        actualMinutes: 30,
      },
      {
        customerId: 'CUS-116',
        customerName: 'Flores do Douro Gaia',
        city: 'Vila Nova de Gaia',
        sequence: 3,
        etaMinutes: 35,
      },
      {
        customerId: 'CUS-117',
        customerName: 'Jardim da Quinta Matosinhos',
        city: 'Matosinhos',
        sequence: 4,
        etaMinutes: 40,
      },
      {
        customerId: 'CUS-118',
        customerName: 'Bouquet Boavista',
        city: 'Porto',
        sequence: 5,
        etaMinutes: 30,
      },
      {
        customerId: 'CUS-119',
        customerName: 'Rosa Brava Maia',
        city: 'Maia',
        sequence: 6,
        etaMinutes: 45,
      },
    ],
  },

  // ROUTE-2026-W19-002 – Lisboa Norte - Cascais (DRAFT)
  {
    id: 'ROUTE-2026-W19-002',
    name: 'Lisboa Norte – Cascais',
    salesRep: 'Ana Martins',
    plannedDate: '2026-05-14',
    status: 'DRAFT',
    totalKm: 72,
    totalEtaMinutes: 240,
    stops: [
      {
        customerId: 'CUS-108',
        customerName: 'Bouquet Lisboa',
        city: 'Lisboa',
        sequence: 1,
        etaMinutes: 30,
      },
      {
        customerId: 'CUS-120',
        customerName: 'Ateliê das Flores Sintra',
        city: 'Sintra',
        sequence: 2,
        etaMinutes: 50,
      },
      {
        customerId: 'CUS-109',
        customerName: 'Fleur de Lis Cascais',
        city: 'Cascais',
        sequence: 3,
        etaMinutes: 40,
      },
      {
        customerId: 'CUS-121',
        customerName: 'Mar de Flores Oeiras',
        city: 'Oeiras',
        sequence: 4,
        etaMinutes: 35,
      },
      {
        customerId: 'CUS-122',
        customerName: 'Verde Vivo Amadora',
        city: 'Amadora',
        sequence: 5,
        etaMinutes: 45,
      },
      {
        customerId: 'CUS-123',
        customerName: 'Pétala de Rosa Loures',
        city: 'Loures',
        sequence: 6,
        etaMinutes: 40,
      },
    ],
  },

  // ROUTE-2026-W18-003 – Madrid Periferia (DONE)
  {
    id: 'ROUTE-2026-W18-003',
    name: 'Madrid Periferia',
    salesRep: 'Tiago Sousa',
    plannedDate: '2026-05-07',
    status: 'DONE',
    totalKm: 110,
    totalEtaMinutes: 300,
    stops: [
      {
        customerId: 'CUS-106',
        customerName: 'Verde Naranja Madrid',
        city: 'Madrid',
        sequence: 1,
        etaMinutes: 45,
        actualMinutes: 50,
      },
      {
        customerId: 'CUS-124',
        customerName: 'Florecer Getafe',
        city: 'Getafe',
        sequence: 2,
        etaMinutes: 40,
        actualMinutes: 38,
      },
      {
        customerId: 'CUS-125',
        customerName: 'Jardin Alcalá',
        city: 'Alcalá de Henares',
        sequence: 3,
        etaMinutes: 60,
        actualMinutes: 65,
      },
      {
        customerId: 'CUS-126',
        customerName: 'Flores Leganés',
        city: 'Leganés',
        sequence: 4,
        etaMinutes: 35,
        actualMinutes: 32,
      },
      {
        customerId: 'CUS-127',
        customerName: 'Prado Floral Torrejón',
        city: 'Torrejón de Ardoz',
        sequence: 5,
        etaMinutes: 50,
        actualMinutes: 55,
      },
      {
        customerId: 'CUS-128',
        customerName: 'Botanical Fuenlabrada',
        city: 'Fuenlabrada',
        sequence: 6,
        etaMinutes: 40,
        actualMinutes: 42,
      },
      {
        customerId: 'CUS-129',
        customerName: 'El Rosal Móstoles',
        city: 'Móstoles',
        sequence: 7,
        etaMinutes: 30,
        actualMinutes: 28,
      },
    ],
  },

  // ROUTE-2026-W19-004 – Algarve Costa (DRAFT)
  {
    id: 'ROUTE-2026-W19-004',
    name: 'Algarve Costa',
    salesRep: 'Ana Martins',
    plannedDate: '2026-05-15',
    status: 'DRAFT',
    totalKm: 95,
    totalEtaMinutes: 280,
    stops: [
      {
        customerId: 'CUS-111',
        customerName: 'Botânica Faro',
        city: 'Faro',
        sequence: 1,
        etaMinutes: 40,
      },
      {
        customerId: 'CUS-130',
        customerName: 'Flores do Mar Olhão',
        city: 'Olhão',
        sequence: 2,
        etaMinutes: 30,
      },
      {
        customerId: 'CUS-131',
        customerName: 'Quinta das Flores Loulé',
        city: 'Loulé',
        sequence: 3,
        etaMinutes: 35,
      },
      {
        customerId: 'CUS-132',
        customerName: 'Sol Florido Albufeira',
        city: 'Albufeira',
        sequence: 4,
        etaMinutes: 55,
      },
      {
        customerId: 'CUS-133',
        customerName: 'Jardim Portimão',
        city: 'Portimão',
        sequence: 5,
        etaMinutes: 60,
      },
      {
        customerId: 'CUS-134',
        customerName: 'Brisa do Atlântico Lagos',
        city: 'Lagos',
        sequence: 6,
        etaMinutes: 40,
      },
      {
        customerId: 'CUS-135',
        customerName: 'Pétala Sagres',
        city: 'Sagres',
        sequence: 7,
        etaMinutes: 20,
      },
    ],
  },

  // ROUTE-2026-W18-005 – Braga + Minho (DONE)
  {
    id: 'ROUTE-2026-W18-005',
    name: 'Braga + Minho',
    salesRep: 'Pedro Silva',
    plannedDate: '2026-05-06',
    status: 'DONE',
    totalKm: 83,
    totalEtaMinutes: 245,
    stops: [
      {
        customerId: 'CUS-103',
        customerName: 'Jardim Secreto Braga',
        city: 'Braga',
        sequence: 1,
        etaMinutes: 35,
        actualMinutes: 40,
      },
      {
        customerId: 'CUS-136',
        customerName: 'Flor do Campo Barcelos',
        city: 'Barcelos',
        sequence: 2,
        etaMinutes: 30,
        actualMinutes: 28,
      },
      {
        customerId: 'CUS-137',
        customerName: 'Natureza Viva Viana',
        city: 'Viana do Castelo',
        sequence: 3,
        etaMinutes: 50,
        actualMinutes: 55,
      },
      {
        customerId: 'CUS-138',
        customerName: 'Essência Floral Ponte Lima',
        city: 'Ponte de Lima',
        sequence: 4,
        etaMinutes: 45,
        actualMinutes: 42,
      },
      {
        customerId: 'CUS-139',
        customerName: 'Verde Minho Arcos',
        city: 'Arcos de Valdevez',
        sequence: 5,
        etaMinutes: 40,
        actualMinutes: 38,
      },
      {
        customerId: 'CUS-140',
        customerName: 'Flor Minhota Braga Sul',
        city: 'Braga',
        sequence: 6,
        etaMinutes: 45,
        actualMinutes: 48,
      },
    ],
  },

  // ROUTE-2026-W19-006 – Coimbra + Centro (DRAFT)
  {
    id: 'ROUTE-2026-W19-006',
    name: 'Coimbra + Centro',
    salesRep: 'Pedro Silva',
    plannedDate: '2026-05-16',
    status: 'DRAFT',
    totalKm: 68,
    totalEtaMinutes: 210,
    stops: [
      {
        customerId: 'CUS-102',
        customerName: 'Atelier Flora Coimbra',
        city: 'Coimbra',
        sequence: 1,
        etaMinutes: 35,
      },
      {
        customerId: 'CUS-141',
        customerName: 'Flores da Beira Figueira',
        city: 'Figueira da Foz',
        sequence: 2,
        etaMinutes: 40,
      },
      {
        customerId: 'CUS-113',
        customerName: 'Pétalas & Sonhos Aveiro',
        city: 'Aveiro',
        sequence: 3,
        etaMinutes: 45,
      },
      {
        customerId: 'CUS-142',
        customerName: 'Jardim do Mondego Coimbra',
        city: 'Coimbra',
        sequence: 4,
        etaMinutes: 30,
      },
      {
        customerId: 'CUS-143',
        customerName: 'Floral Pombal',
        city: 'Pombal',
        sequence: 5,
        etaMinutes: 35,
      },
      {
        customerId: 'CUS-144',
        customerName: 'Florescer Leiria',
        city: 'Leiria',
        sequence: 6,
        etaMinutes: 25,
      },
    ],
  },
];
