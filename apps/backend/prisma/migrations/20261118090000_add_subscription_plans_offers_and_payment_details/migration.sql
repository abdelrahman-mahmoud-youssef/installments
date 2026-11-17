-- CreateEnum
CREATE TYPE "SubscriptionSource" AS ENUM ('PLAN', 'OFFER', 'MANUAL', 'REFERRAL_REWARD');

-- CreateEnum
CREATE TYPE "SubscriptionPaymentMethod" AS ENUM ('INSTAPAY', 'CASH', 'OTHER', 'FREE');

-- CreateTable
CREATE TABLE "SubscriptionPlan" (
    "id" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "nameAr" TEXT NOT NULL,
    "months" INTEGER NOT NULL,
    "price" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SubscriptionPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubscriptionOffer" (
    "id" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "nameAr" TEXT NOT NULL,
    "months" INTEGER NOT NULL,
    "price" INTEGER NOT NULL,
    "regularPrice" INTEGER NOT NULL,
    "startsOn" DATE NOT NULL,
    "endsOn" DATE NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SubscriptionOffer_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "TenantSubscription" ADD COLUMN     "listPrice" INTEGER,
ADD COLUMN     "months" INTEGER,
ADD COLUMN     "note" TEXT,
ADD COLUMN     "offerId" TEXT,
ADD COLUMN     "paidAt" DATE,
ADD COLUMN     "paymentMethod" "SubscriptionPaymentMethod",
ADD COLUMN     "planId" TEXT,
ADD COLUMN     "reference" TEXT,
ADD COLUMN     "source" "SubscriptionSource";

-- Backfill
UPDATE "TenantSubscription"
SET "listPrice" = "amount",
    "months" = 1,
    "paidAt" = "createdAt"::date,
    "paymentMethod" = 'OTHER',
    "source" = 'MANUAL';

ALTER TABLE "TenantSubscription" ALTER COLUMN "listPrice" SET NOT NULL,
ALTER COLUMN "months" SET NOT NULL,
ALTER COLUMN "paidAt" SET NOT NULL,
ALTER COLUMN "paymentMethod" SET NOT NULL,
ALTER COLUMN "source" SET NOT NULL;

-- Seed
INSERT INTO "SubscriptionPlan" ("id", "nameEn", "nameAr", "months", "price", "isActive", "sortOrder", "updatedAt")
VALUES
    ('plan_monthly', 'Monthly', 'شهري', 1, 20000, true, 0, CURRENT_TIMESTAMP),
    ('plan_yearly', 'Yearly', 'سنوي', 12, 200000, true, 1, CURRENT_TIMESTAMP);

-- CreateIndex
CREATE INDEX "SubscriptionPlan_isActive_sortOrder_idx" ON "SubscriptionPlan"("isActive", "sortOrder");

-- CreateIndex
CREATE INDEX "SubscriptionOffer_isActive_startsOn_endsOn_idx" ON "SubscriptionOffer"("isActive", "startsOn", "endsOn");

-- CreateIndex
CREATE INDEX "TenantSubscription_tenantId_paidAt_idx" ON "TenantSubscription"("tenantId", "paidAt");

-- CreateIndex
CREATE INDEX "TenantSubscription_paidAt_idx" ON "TenantSubscription"("paidAt");

-- CreateIndex
CREATE INDEX "TenantSubscription_planId_idx" ON "TenantSubscription"("planId");

-- CreateIndex
CREATE INDEX "TenantSubscription_offerId_tenantId_idx" ON "TenantSubscription"("offerId", "tenantId");

-- AddForeignKey
ALTER TABLE "TenantSubscription" ADD CONSTRAINT "TenantSubscription_planId_fkey" FOREIGN KEY ("planId") REFERENCES "SubscriptionPlan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TenantSubscription" ADD CONSTRAINT "TenantSubscription_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES "SubscriptionOffer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
