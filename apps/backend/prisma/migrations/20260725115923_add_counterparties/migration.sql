-- DropForeignKey
ALTER TABLE "PaymentClaim" DROP CONSTRAINT "PaymentClaim_installmentId_fkey";

-- AlterTable
ALTER TABLE "PaymentMethodTransaction" ADD COLUMN     "counterpartyId" TEXT;

-- CreateTable
CREATE TABLE "Counterparty" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Counterparty_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CounterpartyAdjustment" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "counterpartyId" TEXT NOT NULL,
    "direction" "PaymentDirection" NOT NULL,
    "amount" INTEGER NOT NULL,
    "note" TEXT,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CounterpartyAdjustment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Counterparty_tenantId_name_idx" ON "Counterparty"("tenantId", "name");

-- CreateIndex
CREATE INDEX "CounterpartyAdjustment_tenantId_counterpartyId_occurredAt_idx" ON "CounterpartyAdjustment"("tenantId", "counterpartyId", "occurredAt");

-- CreateIndex
CREATE INDEX "PaymentMethodTransaction_tenantId_counterpartyId_occurredAt_idx" ON "PaymentMethodTransaction"("tenantId", "counterpartyId", "occurredAt");

-- AddForeignKey
ALTER TABLE "PaymentMethodTransaction" ADD CONSTRAINT "PaymentMethodTransaction_counterpartyId_fkey" FOREIGN KEY ("counterpartyId") REFERENCES "Counterparty"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Counterparty" ADD CONSTRAINT "Counterparty_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CounterpartyAdjustment" ADD CONSTRAINT "CounterpartyAdjustment_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CounterpartyAdjustment" ADD CONSTRAINT "CounterpartyAdjustment_counterpartyId_fkey" FOREIGN KEY ("counterpartyId") REFERENCES "Counterparty"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentClaim" ADD CONSTRAINT "PaymentClaim_installmentId_fkey" FOREIGN KEY ("installmentId") REFERENCES "Installment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- RenameIndex
ALTER INDEX "PaymentMethodTransaction_tenantId_paymentMethodId_occurredAt_id" RENAME TO "PaymentMethodTransaction_tenantId_paymentMethodId_occurredA_idx";
