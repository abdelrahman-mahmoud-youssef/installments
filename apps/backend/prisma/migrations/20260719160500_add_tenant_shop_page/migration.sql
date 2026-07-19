-- AlterTable
ALTER TABLE "Tenant" ADD COLUMN     "publicId" TEXT,
ADD COLUMN     "about" TEXT,
ADD COLUMN     "instagramUrl" TEXT,
ADD COLUMN     "facebookUrl" TEXT,
ADD COLUMN     "tiktokUrl" TEXT,
ADD COLUMN     "showInstallmentCalculator" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "calculatorMarkupPercent" DOUBLE PRECISION,
ADD COLUMN     "calculatorInstallmentMonths" INTEGER[] NOT NULL DEFAULT ARRAY[]::INTEGER[];

-- Backfill publicId for existing rows
UPDATE "Tenant" SET "publicId" = gen_random_uuid()::text WHERE "publicId" IS NULL;

-- Make publicId required
ALTER TABLE "Tenant" ALTER COLUMN "publicId" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Tenant_publicId_key" ON "Tenant"("publicId");
