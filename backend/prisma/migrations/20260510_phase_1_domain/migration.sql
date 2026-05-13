-- CreateEnum
CREATE TYPE "SupplierType" AS ENUM ('ALIBABA_SELLER', 'EU_IMPORTER', 'DIRECT_MANUFACTURER', 'DOMESTIC');

-- CreateEnum
CREATE TYPE "Incoterm" AS ENUM ('FOB', 'CIF', 'EXW', 'DAP', 'DDP');

-- CreateEnum
CREATE TYPE "CustomerBusinessType" AS ENUM ('PHYSICAL_SHOP', 'EVENT_ATELIER', 'DECORATOR', 'HOTEL_RESTAURANT', 'ONLINE_ONLY', 'MIXED');

-- CreateEnum
CREATE TYPE "PricingTier" AS ENUM ('STANDARD', 'PROFESSIONAL', 'KEY_ACCOUNT', 'DISTRIBUTOR');

-- CreateEnum
CREATE TYPE "CustomerStatus" AS ENUM ('PROSPECT', 'ACTIVE', 'AT_RISK', 'CHURNED', 'BLOCKED');

-- CreateEnum
CREATE TYPE "PreferredChannel" AS ENUM ('WHATSAPP', 'EMAIL', 'PHONE', 'IN_PERSON');

-- CreateEnum
CREATE TYPE "DayOfWeek" AS ENUM ('MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY');

-- CreateEnum
CREATE TYPE "LeadStatus" AS ENUM ('NEW', 'CONTACTED', 'QUALIFIED', 'NEGOTIATING', 'WON', 'LOST');

-- CreateEnum
CREATE TYPE "LeadSource" AS ENUM ('REFERRAL', 'WEBSITE', 'INSTAGRAM', 'COLD_OUTREACH', 'EVENT_FAIR', 'GOOGLE_PLACES', 'OTHER');

-- CreateEnum
CREATE TYPE "ActivityKind" AS ENUM ('CALL', 'VISIT', 'MEETING', 'WHATSAPP_IN', 'WHATSAPP_OUT', 'EMAIL_IN', 'EMAIL_OUT', 'ORDER_PLACED', 'ORDER_DELIVERED', 'RETURN_OPENED', 'NOTE', 'CONVERTED_FROM_LEAD', 'STATUS_CHANGED');

-- CreateEnum
CREATE TYPE "ProductCategory" AS ENUM ('DRY_FLOWERS', 'PRESERVED_FLOWERS', 'VASES_CONTAINERS', 'FLORAL_FOAM', 'RIBBONS_PACKAGING', 'TOOLS_ACCESSORIES', 'ARTIFICIAL_PLANTS', 'DECORATIVE_OBJECTS');

-- CreateEnum
CREATE TYPE "MaterialPrimary" AS ENUM ('GLASS', 'CERAMIC', 'METAL', 'WOOD', 'NATURAL_FIBER', 'FOAM', 'RESIN', 'PLASTIC', 'TEXTILE', 'PAPER', 'OTHER');

-- CreateEnum
CREATE TYPE "ProductFinish" AS ENUM ('MATTE', 'GLOSSY', 'RUSTIC', 'METALLIC', 'TEXTURED', 'TRANSPARENT');

-- CreateEnum
CREATE TYPE "VisualStyle" AS ENUM ('RUSTIC', 'ROMANTIC', 'MODERN', 'MINIMALIST', 'BOHO', 'CLASSIC', 'FUNERAL');

-- CreateEnum
CREATE TYPE "HumiditySensitivity" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateEnum
CREATE TYPE "ProductDecision" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'DISCONTINUED');

-- CreateEnum
CREATE TYPE "ProductStatus" AS ENUM ('ACTIVE', 'OUT_OF_STOCK', 'DISCONTINUED', 'COMING_SOON');

-- CreateEnum
CREATE TYPE "MediaKind" AS ENUM ('PHOTO', 'VIDEO', 'TECH_SHEET');

-- CreateTable
CREATE TABLE "supplier" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "legalName" TEXT,
    "country" CHAR(2) NOT NULL,
    "type" "SupplierType" NOT NULL,
    "taxId" TEXT,
    "contacts" JSONB NOT NULL DEFAULT '[]',
    "paymentTerms" TEXT,
    "incoterms" "Incoterm",
    "defaultLeadTimeDays" INTEGER,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "notes" TEXT,
    "scoreCache" INTEGER,
    "onTimeRate" DECIMAL(5,4),
    "defectRate" DECIMAL(5,4),
    "avgResponseHours" DECIMAL(8,2),
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "supplier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customer" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "businessType" "CustomerBusinessType" NOT NULL,
    "legalName" TEXT NOT NULL,
    "tradingName" TEXT,
    "taxId" TEXT,
    "taxCountry" CHAR(2),
    "addresses" JSONB NOT NULL DEFAULT '[]',
    "contacts" JSONB NOT NULL DEFAULT '[]',
    "phonePrimary" TEXT,
    "whatsappNumber" TEXT,
    "email" TEXT,
    "website" TEXT,
    "instagramHandle" TEXT,
    "pricingTier" "PricingTier" NOT NULL DEFAULT 'STANDARD',
    "salesRepId" TEXT,
    "creditLimitEur" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "paymentTermDays" INTEGER NOT NULL DEFAULT 0,
    "preferredChannel" "PreferredChannel",
    "preferredDeliveryDay" "DayOfWeek",
    "shopSizeSqm" INTEGER,
    "estimatedMonthlyVolumeEur" DECIMAL(12,2),
    "peakSeasons" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "status" "CustomerStatus" NOT NULL DEFAULT 'ACTIVE',
    "churnRiskScore" DECIMAL(5,2),
    "firstOrderAt" TIMESTAMP(3),
    "lastOrderAt" TIMESTAMP(3),
    "lifetimeValueEur" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "geoLat" DECIMAL(9,6),
    "geoLng" DECIMAL(9,6),
    "deliveryZone" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "customer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customer_lead" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "tradingName" TEXT NOT NULL,
    "legalName" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "whatsappNumber" TEXT,
    "source" "LeadSource" NOT NULL DEFAULT 'OTHER',
    "businessType" "CustomerBusinessType",
    "instagramHandle" TEXT,
    "instagramFollowers" INTEGER,
    "shopSizeSqm" INTEGER,
    "estimatedMonthlyVolumeEur" DECIMAL(12,2),
    "geoZone" TEXT,
    "notes" TEXT,
    "status" "LeadStatus" NOT NULL DEFAULT 'NEW',
    "score" INTEGER NOT NULL DEFAULT 0,
    "salesRepId" TEXT,
    "convertedAt" TIMESTAMP(3),
    "convertedToCustomerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "customer_lead_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customer_activity" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "actorId" TEXT,
    "kind" "ActivityKind" NOT NULL,
    "payload" JSONB NOT NULL DEFAULT '{}',
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "customer_activity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "category" "ProductCategory" NOT NULL,
    "subcategory" TEXT,
    "description" TEXT,
    "shortDescription" TEXT,
    "brand" TEXT,
    "supplierId" TEXT,
    "supplierSku" TEXT,
    "originCountry" CHAR(2),
    "heightCm" DECIMAL(8,2),
    "widthCm" DECIMAL(8,2),
    "depthCm" DECIMAL(8,2),
    "weightG" DECIMAL(10,2),
    "materialPrimary" "MaterialPrimary",
    "finish" "ProductFinish",
    "dominantColor" TEXT,
    "secondaryColors" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "visualStyle" "VisualStyle",
    "isPreserved" BOOLEAN NOT NULL DEFAULT false,
    "isDried" BOOLEAN NOT NULL DEFAULT false,
    "botanicalName" TEXT,
    "shelfLifeMonths" INTEGER,
    "sensitivityToHumidity" "HumiditySensitivity",
    "batchOriginDate" TIMESTAMP(3),
    "seasonality" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "peakMonths" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
    "costEur" DECIMAL(12,2) NOT NULL,
    "recommendedRetailEur" DECIMAL(12,2),
    "moq" INTEGER NOT NULL DEFAULT 1,
    "caseSize" INTEGER NOT NULL DEFAULT 1,
    "leadTimeDays" INTEGER,
    "score" DECIMAL(4,2),
    "visualScore" DECIMAL(4,2),
    "comment" TEXT,
    "decision" "ProductDecision" NOT NULL DEFAULT 'PENDING',
    "isAnchor" BOOLEAN NOT NULL DEFAULT false,
    "status" "ProductStatus" NOT NULL DEFAULT 'ACTIVE',
    "firstSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSoldAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_variant" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "attributes" JSONB NOT NULL DEFAULT '{}',
    "costEur" DECIMAL(12,2),
    "weightG" DECIMAL(10,2),
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_variant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_media" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "kind" "MediaKind" NOT NULL DEFAULT 'PHOTO',
    "url" TEXT NOT NULL,
    "altText" TEXT,
    "position" INTEGER NOT NULL DEFAULT 0,
    "visionTags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "qualityIssues" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_media_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_vote" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "score" DECIMAL(4,2) NOT NULL,
    "visualScore" DECIMAL(4,2),
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_vote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bundle" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "items" JSONB NOT NULL DEFAULT '[]',
    "priceEur" DECIMAL(12,2),
    "seasonalityTag" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "bundle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_log" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "actorId" TEXT,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "changes" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_log_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "supplier_organizationId_idx" ON "supplier"("organizationId");

-- CreateIndex
CREATE INDEX "supplier_organizationId_status_idx" ON "supplier"("organizationId", "status");

-- CreateIndex
CREATE INDEX "supplier_organizationId_name_idx" ON "supplier"("organizationId", "name");

-- CreateIndex
CREATE INDEX "customer_organizationId_idx" ON "customer"("organizationId");

-- CreateIndex
CREATE INDEX "customer_organizationId_status_idx" ON "customer"("organizationId", "status");

-- CreateIndex
CREATE INDEX "customer_organizationId_salesRepId_idx" ON "customer"("organizationId", "salesRepId");

-- CreateIndex
CREATE INDEX "customer_organizationId_pricingTier_idx" ON "customer"("organizationId", "pricingTier");

-- CreateIndex
CREATE INDEX "customer_lead_organizationId_idx" ON "customer_lead"("organizationId");

-- CreateIndex
CREATE INDEX "customer_lead_organizationId_status_idx" ON "customer_lead"("organizationId", "status");

-- CreateIndex
CREATE INDEX "customer_lead_organizationId_salesRepId_idx" ON "customer_lead"("organizationId", "salesRepId");

-- CreateIndex
CREATE INDEX "customer_activity_organizationId_customerId_occurredAt_idx" ON "customer_activity"("organizationId", "customerId", "occurredAt" DESC);

-- CreateIndex
CREATE INDEX "customer_activity_organizationId_kind_idx" ON "customer_activity"("organizationId", "kind");

-- CreateIndex
CREATE INDEX "product_organizationId_idx" ON "product"("organizationId");

-- CreateIndex
CREATE INDEX "product_organizationId_category_idx" ON "product"("organizationId", "category");

-- CreateIndex
CREATE INDEX "product_organizationId_decision_idx" ON "product"("organizationId", "decision");

-- CreateIndex
CREATE INDEX "product_organizationId_status_idx" ON "product"("organizationId", "status");

-- CreateIndex
CREATE INDEX "product_organizationId_supplierId_idx" ON "product"("organizationId", "supplierId");

-- CreateIndex
CREATE UNIQUE INDEX "product_organizationId_sku_key" ON "product"("organizationId", "sku");

-- CreateIndex
CREATE UNIQUE INDEX "product_organizationId_slug_key" ON "product"("organizationId", "slug");

-- CreateIndex
CREATE INDEX "product_variant_productId_idx" ON "product_variant"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "product_variant_organizationId_sku_key" ON "product_variant"("organizationId", "sku");

-- CreateIndex
CREATE INDEX "product_media_productId_idx" ON "product_media"("productId");

-- CreateIndex
CREATE INDEX "product_vote_organizationId_productId_idx" ON "product_vote"("organizationId", "productId");

-- CreateIndex
CREATE UNIQUE INDEX "product_vote_productId_userId_key" ON "product_vote"("productId", "userId");

-- CreateIndex
CREATE INDEX "bundle_organizationId_idx" ON "bundle"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "bundle_organizationId_slug_key" ON "bundle"("organizationId", "slug");

-- CreateIndex
CREATE INDEX "audit_log_organizationId_createdAt_idx" ON "audit_log"("organizationId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "audit_log_organizationId_entityType_entityId_idx" ON "audit_log"("organizationId", "entityType", "entityId");

-- AddForeignKey
ALTER TABLE "supplier" ADD CONSTRAINT "supplier_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer" ADD CONSTRAINT "customer_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer" ADD CONSTRAINT "customer_salesRepId_fkey" FOREIGN KEY ("salesRepId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_lead" ADD CONSTRAINT "customer_lead_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_lead" ADD CONSTRAINT "customer_lead_salesRepId_fkey" FOREIGN KEY ("salesRepId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_lead" ADD CONSTRAINT "customer_lead_convertedToCustomerId_fkey" FOREIGN KEY ("convertedToCustomerId") REFERENCES "customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_activity" ADD CONSTRAINT "customer_activity_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_activity" ADD CONSTRAINT "customer_activity_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_activity" ADD CONSTRAINT "customer_activity_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product" ADD CONSTRAINT "product_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product" ADD CONSTRAINT "product_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "supplier"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_variant" ADD CONSTRAINT "product_variant_productId_fkey" FOREIGN KEY ("productId") REFERENCES "product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_media" ADD CONSTRAINT "product_media_productId_fkey" FOREIGN KEY ("productId") REFERENCES "product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_vote" ADD CONSTRAINT "product_vote_productId_fkey" FOREIGN KEY ("productId") REFERENCES "product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_vote" ADD CONSTRAINT "product_vote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bundle" ADD CONSTRAINT "bundle_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

