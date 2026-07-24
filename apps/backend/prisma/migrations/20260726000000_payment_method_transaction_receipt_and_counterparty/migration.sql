-- AlterTable
ALTER TABLE "PaymentMethodTransaction" ADD COLUMN     "counterpartyName" TEXT,
ADD COLUMN     "counterpartyPhone" TEXT,
ADD COLUMN     "receiptUrl" TEXT;
