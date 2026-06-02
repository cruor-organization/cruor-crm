-- CreateEnum
CREATE TYPE "QuoteStatus" AS ENUM ('DRAFT', 'SENT', 'ACCEPTED', 'REJECTED', 'EXPIRED', 'CANCELLED');

-- CreateTable
CREATE TABLE "quote" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "quoteNumber" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "salesRepId" TEXT,
    "status" "QuoteStatus" NOT NULL DEFAULT 'DRAFT',
    "currency" CHAR(3) NOT NULL DEFAULT 'EUR',
    "subtotalEur" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "vatEur" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "totalEur" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "notes" TEXT,
    "validUntil" TIMESTAMP(3),
    "convertedOrderId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "quote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quote_line" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "quoteId" TEXT NOT NULL,
    "variantId" TEXT NOT NULL,
    "qty" INTEGER NOT NULL,
    "unitPriceEur" DECIMAL(12,2) NOT NULL,
    "discountPct" DECIMAL(5,4) NOT NULL DEFAULT 0,
    "vatPct" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "lineTotalEur" DECIMAL(14,2) NOT NULL,
    "priceSource" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "quote_line_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "quote_organizationId_status_idx" ON "quote"("organizationId", "status");

-- CreateIndex
CREATE INDEX "quote_organizationId_customerId_idx" ON "quote"("organizationId", "customerId");

-- CreateIndex
CREATE UNIQUE INDEX "quote_organizationId_quoteNumber_key" ON "quote"("organizationId", "quoteNumber");

-- CreateIndex
CREATE INDEX "quote_line_organizationId_quoteId_idx" ON "quote_line"("organizationId", "quoteId");

-- CreateIndex
CREATE UNIQUE INDEX "quote_line_quoteId_variantId_key" ON "quote_line"("quoteId", "variantId");

-- AddForeignKey
ALTER TABLE "quote" ADD CONSTRAINT "quote_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quote" ADD CONSTRAINT "quote_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quote_line" ADD CONSTRAINT "quote_line_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "quote"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quote_line" ADD CONSTRAINT "quote_line_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "product_variant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
