-- AlterTable
ALTER TABLE "Contract" ADD COLUMN "publicId" TEXT;

-- Backfill publicId for existing rows
UPDATE "Contract" SET "publicId" = gen_random_uuid()::text WHERE "publicId" IS NULL;

-- Make publicId required
ALTER TABLE "Contract" ALTER COLUMN "publicId" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Contract_publicId_key" ON "Contract"("publicId");
