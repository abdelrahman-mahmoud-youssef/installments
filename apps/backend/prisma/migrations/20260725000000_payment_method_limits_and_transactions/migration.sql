-- CreateEnum
CREATE TYPE "PaymentDirection" AS ENUM ('IN', 'OUT');

-- AlterTable
ALTER TABLE "PaymentMethod" ADD COLUMN     "monthlyLimit" INTEGER,
ADD COLUMN     "lastLimitAlertMonth" TEXT;

-- AlterTable
ALTER TABLE "Payment" ADD COLUMN     "paymentMethodId" TEXT;

-- CreateTable
CREATE TABLE "PaymentMethodTransaction" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "paymentMethodId" TEXT NOT NULL,
    "direction" "PaymentDirection" NOT NULL,
    "amount" INTEGER NOT NULL,
    "note" TEXT,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PaymentMethodTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Payment_tenantId_paymentMethodId_paidAt_idx" ON "Payment"("tenantId", "paymentMethodId", "paidAt");

-- CreateIndex
CREATE INDEX "PaymentMethodTransaction_tenantId_paymentMethodId_occurredAt_idx" ON "PaymentMethodTransaction"("tenantId", "paymentMethodId", "occurredAt");

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_paymentMethodId_fkey" FOREIGN KEY ("paymentMethodId") REFERENCES "PaymentMethod"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentMethodTransaction" ADD CONSTRAINT "PaymentMethodTransaction_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentMethodTransaction" ADD CONSTRAINT "PaymentMethodTransaction_paymentMethodId_fkey" FOREIGN KEY ("paymentMethodId") REFERENCES "PaymentMethod"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
