-- Fase 2 — Stock & Pricing (§10.13, §10.15, §7.5)
--
-- 6 tabelas: stock_location, stock_level, stock_movement, price_list,
-- price_list_line, customer_special_price.
--
-- Hard invariants reforçados via CHECK no fim do ficheiro:
--   * stock_level.available  >= 0
--   * stock_level.reserved   >= 0
--   * stock_movement.qty     >  0 (qty sempre positivo; direção pelo `kind`)
--
-- Price floor (landed × 1.10) é validado em domain (enforceFloor), não em
-- CHECK, porque depende de cross-table join com product_variant.cost_eur.

-- CreateEnum
CREATE TYPE "StockMovementKind" AS ENUM ('IN', 'OUT', 'RESERVE', 'RELEASE', 'ADJUST', 'RETURN', 'TRANSFER_IN', 'TRANSFER_OUT');

-- CreateEnum
CREATE TYPE "StockMovementRefType" AS ENUM ('ORDER', 'QUOTE', 'PURCHASE', 'RETURN_DOC', 'ADJUSTMENT', 'TRANSFER', 'NONE');

-- CreateEnum
CREATE TYPE "PriceListStatus" AS ENUM ('DRAFT', 'ACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "PriceListCurrency" AS ENUM ('EUR');

-- CreateTable
CREATE TABLE "stock_location" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "country" CHAR(2) NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "stock_location_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock_level" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "variantId" TEXT NOT NULL,
    "locationId" TEXT NOT NULL,
    "available" INTEGER NOT NULL DEFAULT 0,
    "reserved" INTEGER NOT NULL DEFAULT 0,
    "safetyStock" INTEGER NOT NULL DEFAULT 0,
    "expectedExpiryAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "stock_level_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock_movement" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "variantId" TEXT NOT NULL,
    "locationId" TEXT NOT NULL,
    "kind" "StockMovementKind" NOT NULL,
    "qty" INTEGER NOT NULL,
    "refType" "StockMovementRefType" NOT NULL DEFAULT 'NONE',
    "refId" TEXT,
    "batch" TEXT,
    "reason" TEXT,
    "actorId" TEXT,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stock_movement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "price_list" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "tier" "PricingTier" NOT NULL,
    "currency" "PriceListCurrency" NOT NULL DEFAULT 'EUR',
    "validFrom" TIMESTAMP(3) NOT NULL,
    "validUntil" TIMESTAMP(3),
    "status" "PriceListStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "price_list_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "price_list_line" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "priceListId" TEXT NOT NULL,
    "variantId" TEXT NOT NULL,
    "unitPriceEur" DECIMAL(12,2) NOT NULL,
    "minQty" INTEGER NOT NULL DEFAULT 1,
    "discountBreaks" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "price_list_line_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customer_special_price" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "variantId" TEXT NOT NULL,
    "unitPriceEur" DECIMAL(12,2) NOT NULL,
    "validFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "validUntil" TIMESTAMP(3),
    "reason" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customer_special_price_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "stock_location_organizationId_active_idx" ON "stock_location"("organizationId", "active");

-- CreateIndex
CREATE UNIQUE INDEX "stock_location_organizationId_code_key" ON "stock_location"("organizationId", "code");

-- CreateIndex
CREATE INDEX "stock_level_organizationId_locationId_idx" ON "stock_level"("organizationId", "locationId");

-- CreateIndex
CREATE UNIQUE INDEX "stock_level_variantId_locationId_key" ON "stock_level"("variantId", "locationId");

-- CreateIndex
CREATE INDEX "stock_movement_organizationId_variantId_occurredAt_idx" ON "stock_movement"("organizationId", "variantId", "occurredAt" DESC);

-- CreateIndex
CREATE INDEX "stock_movement_organizationId_refType_refId_idx" ON "stock_movement"("organizationId", "refType", "refId");

-- CreateIndex
CREATE INDEX "stock_movement_organizationId_kind_idx" ON "stock_movement"("organizationId", "kind");

-- CreateIndex
CREATE INDEX "price_list_organizationId_tier_status_idx" ON "price_list"("organizationId", "tier", "status");

-- CreateIndex
CREATE UNIQUE INDEX "price_list_organizationId_tier_validFrom_key" ON "price_list"("organizationId", "tier", "validFrom");

-- CreateIndex
CREATE INDEX "price_list_line_organizationId_variantId_idx" ON "price_list_line"("organizationId", "variantId");

-- CreateIndex
CREATE UNIQUE INDEX "price_list_line_priceListId_variantId_minQty_key" ON "price_list_line"("priceListId", "variantId", "minQty");

-- CreateIndex
CREATE INDEX "customer_special_price_organizationId_customerId_variantId_idx" ON "customer_special_price"("organizationId", "customerId", "variantId");

-- CreateIndex
CREATE UNIQUE INDEX "customer_special_price_customerId_variantId_validFrom_key" ON "customer_special_price"("customerId", "variantId", "validFrom");

-- AddForeignKey
ALTER TABLE "stock_location" ADD CONSTRAINT "stock_location_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_level" ADD CONSTRAINT "stock_level_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_level" ADD CONSTRAINT "stock_level_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "product_variant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_level" ADD CONSTRAINT "stock_level_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "stock_location"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_movement" ADD CONSTRAINT "stock_movement_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_movement" ADD CONSTRAINT "stock_movement_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "product_variant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_movement" ADD CONSTRAINT "stock_movement_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "stock_location"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_movement" ADD CONSTRAINT "stock_movement_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "price_list" ADD CONSTRAINT "price_list_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "price_list_line" ADD CONSTRAINT "price_list_line_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "price_list_line" ADD CONSTRAINT "price_list_line_priceListId_fkey" FOREIGN KEY ("priceListId") REFERENCES "price_list"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "price_list_line" ADD CONSTRAINT "price_list_line_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "product_variant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_special_price" ADD CONSTRAINT "customer_special_price_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_special_price" ADD CONSTRAINT "customer_special_price_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_special_price" ADD CONSTRAINT "customer_special_price_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "product_variant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_special_price" ADD CONSTRAINT "customer_special_price_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ----------------------------------------------------------------------------
-- Hard invariants §7.5 — CHECK constraints
-- ----------------------------------------------------------------------------

-- stock_level: nunca pode ficar negativo (cinto e suspensórios; service também valida)
ALTER TABLE "stock_level"
  ADD CONSTRAINT "stock_level_available_nonneg" CHECK ("available" >= 0);

ALTER TABLE "stock_level"
  ADD CONSTRAINT "stock_level_reserved_nonneg" CHECK ("reserved" >= 0);

-- stock_movement: qty é sempre positivo; direção é dada pelo `kind`.
-- Não usar qty assinado — viola contrato §10.13 few-shot.
ALTER TABLE "stock_movement"
  ADD CONSTRAINT "stock_movement_qty_positive" CHECK ("qty" > 0);
