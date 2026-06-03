/**
 * Smoke E2E da faturação (§10.14) contra Postgres real. Prova:
 *  (a) cliente pronto-pagamento → fatura ISSUED ao CONFIRMED;
 *  (b) cliente a crédito → sem fatura ao CONFIRMED, fatura ISSUED ao SHIPPED;
 *  (c) issue idempotente;
 *  (d) pagamento total → PAID;
 *  (e) CREDIT_LIMIT_EXCEEDED sem paymentUpfront.
 * Limpa tudo no fim (delete da org → cascade).
 *
 * Correr: node node_modules/tsx/dist/cli.mjs scripts/verify-invoice-flow.ts
 */
import { randomUUID } from 'node:crypto';

import { prisma } from '../src/db/index.js';
import type { AuthContext } from '../src/middlewares/auth-context.js';
import { createInvoiceProvider } from '../src/modules/invoices/invoice-provider.port.js';
import { invoicesService } from '../src/modules/invoices/invoices.service.js';
import { ordersService, setInvoiceProvider } from '../src/modules/orders/orders.service.js';

async function main(): Promise<void> {
  const orgId = `vinv-${randomUUID()}`;
  const userId = `vinv-user-${randomUUID()}`;
  setInvoiceProvider(createInvoiceProvider('mock'));

  try {
    // ------------------------------------------------------------------ setup
    await prisma.organization.create({ data: { id: orgId, name: 'VERIFY Invoice' } });
    await prisma.user.create({
      data: { id: userId, name: 'V', email: `${userId}@verify.local`, emailVerified: true },
    });
    await prisma.member.create({
      data: { id: randomUUID(), organizationId: orgId, userId, role: 'OWNER' },
    });
    const location = await prisma.stockLocation.create({
      data: { organizationId: orgId, code: 'V', name: 'V', country: 'PT', isDefault: true },
    });
    const product = await prisma.product.create({
      data: {
        organizationId: orgId,
        sku: `V-${randomUUID()}`,
        name: 'V',
        slug: `v-${randomUUID()}`,
        category: 'DRY_FLOWERS',
        costEur: 5,
      },
    });
    const variant = await prisma.productVariant.create({
      data: {
        organizationId: orgId,
        productId: product.id,
        sku: `V-VAR-${randomUUID()}`,
        label: 'V',
        costEur: 5,
      },
    });
    await prisma.stockLevel.create({
      data: {
        organizationId: orgId,
        variantId: variant.id,
        locationId: location.id,
        available: 1000,
      },
    });

    // lista de preços ativa para resolvePrice (tier STANDARD, unitPrice 10 > costEur*1.10=5.50)
    const list = await prisma.priceList.create({
      data: {
        organizationId: orgId,
        name: 'V',
        tier: 'STANDARD',
        status: 'ACTIVE',
        validFrom: new Date('2020-01-01'),
      },
    });
    await prisma.priceListLine.create({
      data: {
        organizationId: orgId,
        priceListId: list.id,
        variantId: variant.id,
        unitPriceEur: 10,
      },
    });

    // cliente pronto-pagamento (paymentTermDays=0, creditLimitEur=0 → upfront bypasses check)
    const prepaid = await prisma.customer.create({
      data: {
        organizationId: orgId,
        legalName: 'Prepaid Flores Lda',
        businessType: 'PHYSICAL_SHOP',
        pricingTier: 'STANDARD',
        paymentTermDays: 0,
        creditLimitEur: 0,
      },
    });

    // cliente a crédito (paymentTermDays=30, creditLimitEur=1000)
    const credit = await prisma.customer.create({
      data: {
        organizationId: orgId,
        legalName: 'Credit Flores Lda',
        businessType: 'PHYSICAL_SHOP',
        pricingTier: 'STANDARD',
        paymentTermDays: 30,
        creditLimitEur: 1000,
      },
    });

    const ctx: AuthContext = {
      actorId: userId,
      email: 'verify@verify.local',
      orgId,
      role: 'OWNER',
    };

    // ----------------------------------------------------------------- (a) prepaid: fatura ao CONFIRMED
    const o1 = await ordersService.create(ctx, {
      customerId: prepaid.id,
      paymentUpfront: true,
      lines: [{ variantId: variant.id, qty: 5 }],
    });
    await ordersService.transition(ctx, o1.id, { to: 'PENDING_CONFIRMATION' });
    await ordersService.transition(ctx, o1.id, { to: 'CONFIRMED' });
    const inv1 = await prisma.invoice.findFirst({ where: { orderId: o1.id } });

    // ----------------------------------------------------------------- (c) issue idempotente
    const reissue = inv1
      ? await invoicesService.issue(ctx, inv1.id, createInvoiceProvider('mock'))
      : null;

    // ----------------------------------------------------------------- (d) pagamento total → PAID
    if (inv1) {
      await invoicesService.registerPayment(ctx, inv1.id, {
        amountEur: Number(inv1.totalEur),
        method: 'TRANSFER',
      });
    }
    const inv1Paid = inv1 ? await prisma.invoice.findUnique({ where: { id: inv1.id } }) : null;

    // ----------------------------------------------------------------- (b) crédito: sem fatura ao CONFIRMED, fatura ao SHIPPED
    const o2 = await ordersService.create(ctx, {
      customerId: credit.id,
      lines: [{ variantId: variant.id, qty: 5 }],
    });
    await ordersService.transition(ctx, o2.id, { to: 'PENDING_CONFIRMATION' });
    await ordersService.transition(ctx, o2.id, { to: 'CONFIRMED' });
    const invAtConfirmed = await prisma.invoice.findFirst({ where: { orderId: o2.id } });
    await ordersService.transition(ctx, o2.id, { to: 'PICKING' });
    await ordersService.transition(ctx, o2.id, { to: 'PACKED' });
    await ordersService.transition(ctx, o2.id, {
      to: 'SHIPPED',
      shipment: { carrier: 'CTT', trackingCode: 'PT123456789PT' },
    });
    const invAtShipped = await prisma.invoice.findFirst({ where: { orderId: o2.id } });

    // ----------------------------------------------------------------- (e) CREDIT_LIMIT_EXCEEDED
    // credit.creditLimitEur=1000; o2 já usou 5*10=50 (ISSUED).
    // Nova encomenda de 200 unidades × 10 = 2000; 50+2000=2050 > 1000 → bloqueado.
    let creditBlocked = false;
    try {
      await ordersService.create(ctx, {
        customerId: credit.id,
        lines: [{ variantId: variant.id, qty: 200 }],
      });
    } catch (err) {
      creditBlocked = (err as { code?: string }).code === 'CREDIT_LIMIT_EXCEEDED';
    }

    // ----------------------------------------------------------------- resultados
    console.log('(a) fatura prepaid status :', inv1?.status, '(esperado ISSUED)');
    console.log('(b) sem fatura ao CONFIRMED:', invAtConfirmed, '(esperado null)');
    console.log('(b) fatura ao SHIPPED status:', invAtShipped?.status, '(esperado ISSUED)');
    console.log('(c) reissue status         :', reissue?.status, '(esperado ISSUED, sem novo número)');
    console.log('(c) número igual           :', reissue?.number === inv1?.number, '(esperado true)');
    console.log('(d) prepaid após pagamento :', inv1Paid?.status, '(esperado PAID)');
    console.log('(e) CREDIT_LIMIT_EXCEEDED  :', creditBlocked, '(esperado true)');

    // ----------------------------------------------------------------- asserções
    const ok =
      inv1?.status === 'ISSUED' &&
      invAtConfirmed === null &&
      invAtShipped?.status === 'ISSUED' &&
      reissue?.status === 'ISSUED' &&
      reissue?.number === inv1?.number &&
      inv1Paid?.status === 'PAID' &&
      creditBlocked === true;

    if (!ok) {
      console.error('\nFAIL - uma ou mais asserções falharam');
      process.exit(1);
    }

    console.log('\nPASS - fluxo de faturação correto');
  } finally {
    await prisma.organization.delete({ where: { id: orgId } }).catch(() => undefined);
    await prisma.user.delete({ where: { id: userId } }).catch(() => undefined);
    await prisma.$disconnect();
  }
}

void main();
