/**
 * Seed de dados de teste para verificação manual / smoke E2E (Playwright).
 *
 * Liga-se à organização `default` criada pelo signup-gate (primeiro user → OWNER)
 * e cria o mínimo para as listagens da UI terem conteúdo:
 *   StockLocation, Product + Variant, StockLevel, PriceList ACTIVE + linha,
 *   2 Customers (pronto-pagamento + crédito), 1 CustomerLead, 1 Supplier.
 *
 * NÃO apaga nada. Idempotente por SKUs/nomes fixos (skip se já existir).
 * Correr: node node_modules/tsx/dist/cli.mjs scripts/seed-test-data.ts
 */
import { prisma } from '../src/db/index.js';

async function main(): Promise<void> {
  const org = await prisma.organization.findFirst({ where: { slug: 'default' } });
  if (!org) {
    console.error('FAIL — organização `default` não existe. Faz signup do OWNER primeiro.');
    process.exit(1);
  }
  const organizationId = org.id;

  const existing = await prisma.product.findFirst({
    where: { organizationId, sku: 'SEED-EUCA-001' },
  });
  if (existing) {
    console.log('Dados de teste já existem — nada a fazer.');
    await prisma.$disconnect();
    return;
  }

  const location = await prisma.stockLocation.create({
    data: { organizationId, code: 'PT-PORTO', name: 'Armazém Porto', country: 'PT', isDefault: true },
  });

  const supplier = await prisma.supplier.create({
    data: {
      organizationId,
      name: 'Yunnan Dried Flowers Co.',
      legalName: 'Yunnan Dried Flowers Co., Ltd',
      country: 'CN',
      type: 'ALIBABA_SELLER',
      defaultLeadTimeDays: 35,
      tags: ['eucalipto', 'preservadas'],
    },
  });

  const product = await prisma.product.create({
    data: {
      organizationId,
      sku: 'SEED-EUCA-001',
      name: 'Eucalipto Preservado Verde',
      slug: 'eucalipto-preservado-verde',
      category: 'PRESERVED_FLOWERS',
      supplierId: supplier.id,
      isPreserved: true,
      shelfLifeMonths: 24,
      costEur: 4.5,
      recommendedRetailEur: 12.9,
      caseSize: 12,
      isAnchor: true,
    },
  });

  const variant = await prisma.productVariant.create({
    data: {
      organizationId,
      productId: product.id,
      sku: 'SEED-EUCA-001-STD',
      label: 'Molho 200g',
      costEur: 4.5,
    },
  });

  await prisma.stockLevel.create({
    data: { organizationId, variantId: variant.id, locationId: location.id, available: 500, safetyStock: 50 },
  });

  const list = await prisma.priceList.create({
    data: {
      organizationId,
      name: 'Tabela STANDARD 2026',
      tier: 'STANDARD',
      status: 'ACTIVE',
      validFrom: new Date('2026-01-01'),
    },
  });
  await prisma.priceListLine.create({
    data: { organizationId, priceListId: list.id, variantId: variant.id, unitPriceEur: 9.9 },
  });

  await prisma.customer.create({
    data: {
      organizationId,
      legalName: 'Florista do Bairro Lda',
      tradingName: 'Florista do Bairro',
      businessType: 'PHYSICAL_SHOP',
      pricingTier: 'STANDARD',
      email: 'geral@floristadobairro.pt',
      phonePrimary: '+351912000111',
      paymentTermDays: 0,
      creditLimitEur: 0,
    },
  });
  await prisma.customer.create({
    data: {
      organizationId,
      legalName: 'Verde & Companhia Lda',
      tradingName: 'Verde & Cia',
      businessType: 'PHYSICAL_SHOP',
      pricingTier: 'PROFESSIONAL',
      email: 'compras@verdecia.pt',
      paymentTermDays: 30,
      creditLimitEur: 5000,
    },
  });

  await prisma.customerLead.create({
    data: {
      organizationId,
      tradingName: 'Atelier Flor de Sal',
      email: 'ola@flordesal.pt',
      businessType: 'EVENT_ATELIER',
      status: 'NEW',
      score: 42,
      notes: 'Contacto via Instagram, interesse em preservadas.',
    },
  });

  console.log('PASS — dados de teste semeados na org', organizationId);
  await prisma.$disconnect();
}

void main();
