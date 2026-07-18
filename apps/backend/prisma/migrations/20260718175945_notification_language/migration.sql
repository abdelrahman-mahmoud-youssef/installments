-- CreateEnum
CREATE TYPE "NotificationLanguage" AS ENUM ('AR', 'EN');

-- AlterTable
ALTER TABLE "Customer" ADD COLUMN     "notificationLanguage" "NotificationLanguage" NOT NULL DEFAULT 'AR';

-- AlterTable
ALTER TABLE "Tenant" ADD COLUMN     "notificationLanguage" "NotificationLanguage" NOT NULL DEFAULT 'AR';
