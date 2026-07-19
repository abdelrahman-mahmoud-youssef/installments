-- DropIndex
DROP INDEX "Tenant_publicId_key";

-- AlterTable
ALTER TABLE "Tenant" ADD COLUMN     "slug" TEXT,
ADD COLUMN     "calculatorPlans" JSONB NOT NULL DEFAULT '[]',
DROP COLUMN "publicId",
DROP COLUMN "calculatorMarkupPercent",
DROP COLUMN "calculatorInstallmentMonths";

-- Backfill slug for existing rows
UPDATE "Tenant"
SET "slug" = lower(regexp_replace(regexp_replace(COALESCE("displayName", "name"), '[^a-zA-Z0-9]+', '-', 'g'), '^-+|-+$', '', 'g')) || '-' || substring(id, 1, 6)
WHERE "slug" IS NULL;

-- Make slug required
ALTER TABLE "Tenant" ALTER COLUMN "slug" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Tenant_slug_key" ON "Tenant"("slug");
