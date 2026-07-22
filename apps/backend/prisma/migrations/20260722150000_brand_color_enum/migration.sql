-- CreateEnum
CREATE TYPE "BrandColor" AS ENUM ('emerald', 'teal', 'blue', 'indigo', 'violet', 'rose', 'amber', 'slate');

-- AlterTable
-- USING cast fails loudly if any existing row holds a value outside the 8
-- presets -- expected to be a no-op since every write already goes through
-- the DTO's @IsIn(BRAND_COLOR_PRESETS) validation.
ALTER TABLE "Tenant" ALTER COLUMN "brandColor" DROP DEFAULT;
ALTER TABLE "Tenant" ALTER COLUMN "brandColor" TYPE "BrandColor" USING "brandColor"::"BrandColor";
ALTER TABLE "Tenant" ALTER COLUMN "brandColor" SET DEFAULT 'emerald';
