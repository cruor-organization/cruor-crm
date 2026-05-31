-- CreateEnum
CREATE TYPE "ShipmentCarrier" AS ENUM ('CTT', 'DPD', 'CHRONOPOST', 'OTHER');

-- AlterTable
ALTER TABLE "customer_order" ADD COLUMN     "carrier" "ShipmentCarrier",
ADD COLUMN     "deliveredAt" TIMESTAMP(3),
ADD COLUMN     "shippedAt" TIMESTAMP(3),
ADD COLUMN     "trackingCode" TEXT;

