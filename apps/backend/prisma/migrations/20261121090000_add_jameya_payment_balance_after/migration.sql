-- AlterTable
ALTER TABLE "JameyaPayment" ADD COLUMN     "balanceAfter" INTEGER NOT NULL;

-- AddCheckConstraint
ALTER TABLE "JameyaPayment" ADD CONSTRAINT "JameyaPayment_balanceAfter_not_negative" CHECK ("balanceAfter" >= 0);
