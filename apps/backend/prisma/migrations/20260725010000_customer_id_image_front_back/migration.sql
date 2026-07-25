-- AlterTable
ALTER TABLE "Customer" ADD COLUMN     "idImageFrontUrl" TEXT;
ALTER TABLE "Customer" ADD COLUMN     "idImageBackUrl" TEXT;

-- Preserve any already-uploaded ID image as the front side
UPDATE "Customer" SET "idImageFrontUrl" = "idImageUrl";

-- AlterTable
ALTER TABLE "Customer" DROP COLUMN "idImageUrl";
