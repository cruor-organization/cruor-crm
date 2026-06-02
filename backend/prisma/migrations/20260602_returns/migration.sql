-- CreateEnum
CREATE TYPE "ReturnStatus" AS ENUM ('REQUESTED', 'RECEIVED', 'REFUNDED', 'REPLACED');

-- CreateEnum
CREATE TYPE "ReturnReason" AS ENUM ('DAMAGED', 'WRONG_ITEM', 'QUALITY', 'SURPLUS', 'OTHER');

-- CreateEnum
CREATE TYPE "ReturnDisposition" AS ENUM ('RESTOCK', 'SCRAP');

-- AlterTable
ALTER TABLE "stock_location" ADD COLUMN     "isQuarantine" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "return" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "returnNumber" TEXT NOT NULL,
    "status" "ReturnStatus" NOT NULL DEFAULT 'REQUESTED',
    "reason" "ReturnReason" NOT NULL,
    "notes" TEXT,
    "actorId" TEXT,
    "receivedAt" TIMESTAMP(3),
    "decidedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "return_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "return_line" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "returnId" TEXT NOT NULL,
    "variantId" TEXT NOT NULL,
    "qty" INTEGER NOT NULL,
    "disposition" "ReturnDisposition",
    "photos" TEXT[],
    "inspectionNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "return_line_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "return_organizationId_status_idx" ON "return"("organizationId", "status");

-- CreateIndex
CREATE INDEX "return_organizationId_orderId_idx" ON "return"("organizationId", "orderId");

-- CreateIndex
CREATE UNIQUE INDEX "return_organizationId_returnNumber_key" ON "return"("organizationId", "returnNumber");

-- CreateIndex
CREATE INDEX "return_line_organizationId_returnId_idx" ON "return_line"("organizationId", "returnId");

-- CreateIndex
CREATE UNIQUE INDEX "return_line_returnId_variantId_key" ON "return_line"("returnId", "variantId");

-- AddForeignKey
ALTER TABLE "return" ADD CONSTRAINT "return_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "return" ADD CONSTRAINT "return_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "customer_order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "return_line" ADD CONSTRAINT "return_line_returnId_fkey" FOREIGN KEY ("returnId") REFERENCES "return"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "return_line" ADD CONSTRAINT "return_line_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "product_variant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
