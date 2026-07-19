-- AlterTable
ALTER TABLE "Tenant" ADD COLUMN     "brandColor" TEXT NOT NULL DEFAULT 'emerald',
ADD COLUMN     "displayName" TEXT,
ADD COLUMN     "logoUrl" TEXT;
