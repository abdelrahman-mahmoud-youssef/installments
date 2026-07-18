-- AlterTable
ALTER TABLE "Customer" ADD COLUMN     "telegramChatId" TEXT,
ADD COLUMN     "telegramNotificationsEnabled" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "Tenant" ADD COLUMN     "telegramBotUsername" TEXT;
