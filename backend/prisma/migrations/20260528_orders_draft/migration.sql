-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('DRAFT', 'PENDING_CONFIRMATION', 'CONFIRMED', 'PICKING', 'PACKED', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'RETURN_REQUESTED', 'RETURN_RECEIVED', 'REFUNDED', 'REPLACED');

-- CreateTable
CREATE TABLE "customer_order" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "orderNumber" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "salesRepId" TEXT,
    "status" "OrderStatus" NOT NULL DEFAULT 'DRAFT',
    "currency" CHAR(3) NOT NULL DEFAULT 'EUR',
    "subtotalEur" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "vatEur" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "totalEur" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "notes" TEXT,
    "requestedDeliveryDate" TIMESTAMP(3),
    "shippingAddress" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customer_order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customer_order_line" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "variantId" TEXT NOT NULL,
    "qty" INTEGER NOT NULL,
    "unitPriceEur" DECIMAL(12,2) NOT NULL,
    "discountPct" DECIMAL(5,4) NOT NULL DEFAULT 0,
    "vatPct" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "lineTotalEur" DECIMAL(14,2) NOT NULL,
    "priceSource" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customer_order_line_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_status_history" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "fromStatus" "OrderStatus",
    "toStatus" "OrderStatus" NOT NULL,
    "actorId" TEXT,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "order_status_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "customer_order_organizationId_status_idx" ON "customer_order"("organizationId", "status");

-- CreateIndex
CREATE INDEX "customer_order_organizationId_customerId_idx" ON "customer_order"("organizationId", "customerId");

-- CreateIndex
CREATE INDEX "customer_order_organizationId_salesRepId_idx" ON "customer_order"("organizationId", "salesRepId");

-- CreateIndex
CREATE UNIQUE INDEX "customer_order_organizationId_orderNumber_key" ON "customer_order"("organizationId", "orderNumber");

-- CreateIndex
CREATE INDEX "customer_order_line_organizationId_orderId_idx" ON "customer_order_line"("organizationId", "orderId");

-- CreateIndex
CREATE UNIQUE INDEX "customer_order_line_orderId_variantId_key" ON "customer_order_line"("orderId", "variantId");

-- CreateIndex
CREATE INDEX "order_status_history_organizationId_orderId_idx" ON "order_status_history"("organizationId", "orderId");

-- AddForeignKey
ALTER TABLE "customer_order" ADD CONSTRAINT "customer_order_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_order" ADD CONSTRAINT "customer_order_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_order" ADD CONSTRAINT "customer_order_salesRepId_fkey" FOREIGN KEY ("salesRepId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_order_line" ADD CONSTRAINT "customer_order_line_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "customer_order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_order_line" ADD CONSTRAINT "customer_order_line_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "product_variant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_status_history" ADD CONSTRAINT "order_status_history_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "customer_order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

