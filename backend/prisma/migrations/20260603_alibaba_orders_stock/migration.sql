-- Fase 3 — Encomendas Alibaba → Stock (§10.12)
-- Tabelas aditivas; não toca tabelas existentes. Invariante "stock incrementado
-- exatamente uma vez por encomenda" garantida no serviço (gate * → DELIVERED +
-- guarda stockAppliedAt). CHECK qty>0 reforçado no fim (convenção stock_movement).

-- CreateEnum
CREATE TYPE "AlibabaOrderStatus" AS ENUM ('PLACED', 'CONFIRMED', 'SHIPPED', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED');

-- CreateTable
CREATE TABLE "alibaba_order" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "supplierId" TEXT,
    "status" "AlibabaOrderStatus" NOT NULL DEFAULT 'PLACED',
    "currency" CHAR(3),
    "placedAt" TIMESTAMP(3),
    "expectedArrival" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "stockAppliedAt" TIMESTAMP(3),
    "raw" JSONB,
    "lastSyncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "alibaba_order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alibaba_order_item" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "alibabaOrderId" TEXT NOT NULL,
    "variantId" TEXT NOT NULL,
    "locationId" TEXT,
    "qty" INTEGER NOT NULL,
    "unitCostEur" DECIMAL(12,2),
    "batch" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "alibaba_order_item_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "alibaba_order_organizationId_status_idx" ON "alibaba_order"("organizationId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "alibaba_order_organizationId_externalId_key" ON "alibaba_order"("organizationId", "externalId");

-- CreateIndex
CREATE INDEX "alibaba_order_item_organizationId_alibabaOrderId_idx" ON "alibaba_order_item"("organizationId", "alibabaOrderId");

-- CreateIndex
CREATE UNIQUE INDEX "alibaba_order_item_alibabaOrderId_variantId_key" ON "alibaba_order_item"("alibabaOrderId", "variantId");

-- AddForeignKey
ALTER TABLE "alibaba_order" ADD CONSTRAINT "alibaba_order_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alibaba_order" ADD CONSTRAINT "alibaba_order_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "supplier"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alibaba_order_item" ADD CONSTRAINT "alibaba_order_item_alibabaOrderId_fkey" FOREIGN KEY ("alibabaOrderId") REFERENCES "alibaba_order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alibaba_order_item" ADD CONSTRAINT "alibaba_order_item_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "product_variant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alibaba_order_item" ADD CONSTRAINT "alibaba_order_item_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "stock_location"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Hard invariant §10.12 — quantidades importadas sempre positivas
ALTER TABLE "alibaba_order_item"
  ADD CONSTRAINT "alibaba_order_item_qty_positive" CHECK ("qty" > 0);
