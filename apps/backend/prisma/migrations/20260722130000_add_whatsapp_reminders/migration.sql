-- CreateEnum
CREATE TYPE "ReminderChannel" AS ENUM ('TELEGRAM', 'WHATSAPP');

-- AlterTable
ALTER TABLE "ReminderLog" ADD COLUMN     "channel" "ReminderChannel" NOT NULL DEFAULT 'TELEGRAM';
