-- CreateEnum
CREATE TYPE "JameyaStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "JameyaDueStatus" AS ENUM ('PENDING', 'PARTIALLY_PAID', 'PAID');

-- AlterTable
ALTER TABLE "Tenant" ADD COLUMN     "jameyaEnabled" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "Jameya" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "shareAmount" INTEGER NOT NULL,
    "shareCount" INTEGER NOT NULL,
    "recurrenceType" "RecurrenceType" NOT NULL,
    "firstDueDate" DATE NOT NULL,
    "graceDays" INTEGER NOT NULL DEFAULT 0,
    "status" "JameyaStatus" NOT NULL DEFAULT 'ACTIVE',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Jameya_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JameyaCycle" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "jameyaId" TEXT NOT NULL,
    "sequence" INTEGER NOT NULL,
    "dueDate" DATE NOT NULL,
    "lateAfter" DATE NOT NULL,

    CONSTRAINT "JameyaCycle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JameyaShare" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "jameyaId" TEXT NOT NULL,
    "cycleId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "halves" INTEGER NOT NULL,

    CONSTRAINT "JameyaShare_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JameyaDue" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "jameyaId" TEXT NOT NULL,
    "cycleId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "paidAmount" INTEGER NOT NULL DEFAULT 0,
    "status" "JameyaDueStatus" NOT NULL DEFAULT 'PENDING',

    CONSTRAINT "JameyaDue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JameyaPayment" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "jameyaId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "paidAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "note" TEXT,
    "clientRequestId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "JameyaPayment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JameyaPaymentAllocation" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "paymentId" TEXT NOT NULL,
    "dueId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,

    CONSTRAINT "JameyaPaymentAllocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JameyaPayout" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "jameyaId" TEXT NOT NULL,
    "cycleId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "collectedAmount" INTEGER NOT NULL,
    "coveredAmount" INTEGER NOT NULL,
    "paidAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "note" TEXT,
    "clientRequestId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "JameyaPayout_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Jameya_tenantId_status_idx" ON "Jameya"("tenantId", "status");

-- CreateIndex
CREATE INDEX "JameyaCycle_tenantId_dueDate_idx" ON "JameyaCycle"("tenantId", "dueDate");

-- CreateIndex
CREATE INDEX "JameyaCycle_tenantId_lateAfter_idx" ON "JameyaCycle"("tenantId", "lateAfter");

-- CreateIndex
CREATE UNIQUE INDEX "JameyaCycle_jameyaId_sequence_key" ON "JameyaCycle"("jameyaId", "sequence");

-- CreateIndex
CREATE INDEX "JameyaShare_jameyaId_customerId_idx" ON "JameyaShare"("jameyaId", "customerId");

-- CreateIndex
CREATE INDEX "JameyaShare_tenantId_customerId_idx" ON "JameyaShare"("tenantId", "customerId");

-- CreateIndex
CREATE UNIQUE INDEX "JameyaShare_cycleId_customerId_key" ON "JameyaShare"("cycleId", "customerId");

-- CreateIndex
CREATE INDEX "JameyaDue_jameyaId_customerId_status_idx" ON "JameyaDue"("jameyaId", "customerId", "status");

-- CreateIndex
CREATE INDEX "JameyaDue_tenantId_status_idx" ON "JameyaDue"("tenantId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "JameyaDue_cycleId_customerId_key" ON "JameyaDue"("cycleId", "customerId");

-- CreateIndex
CREATE INDEX "JameyaPayment_tenantId_paidAt_idx" ON "JameyaPayment"("tenantId", "paidAt");

-- CreateIndex
CREATE INDEX "JameyaPayment_jameyaId_customerId_idx" ON "JameyaPayment"("jameyaId", "customerId");

-- CreateIndex
CREATE UNIQUE INDEX "JameyaPayment_tenantId_clientRequestId_key" ON "JameyaPayment"("tenantId", "clientRequestId");

-- CreateIndex
CREATE INDEX "JameyaPaymentAllocation_paymentId_idx" ON "JameyaPaymentAllocation"("paymentId");

-- CreateIndex
CREATE INDEX "JameyaPaymentAllocation_dueId_idx" ON "JameyaPaymentAllocation"("dueId");

-- CreateIndex
CREATE INDEX "JameyaPaymentAllocation_tenantId_idx" ON "JameyaPaymentAllocation"("tenantId");

-- CreateIndex
CREATE INDEX "JameyaPayout_cycleId_customerId_idx" ON "JameyaPayout"("cycleId", "customerId");

-- CreateIndex
CREATE INDEX "JameyaPayout_tenantId_paidAt_idx" ON "JameyaPayout"("tenantId", "paidAt");

-- CreateIndex
CREATE UNIQUE INDEX "JameyaPayout_tenantId_clientRequestId_key" ON "JameyaPayout"("tenantId", "clientRequestId");

-- AddForeignKey
ALTER TABLE "Jameya" ADD CONSTRAINT "Jameya_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JameyaCycle" ADD CONSTRAINT "JameyaCycle_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JameyaCycle" ADD CONSTRAINT "JameyaCycle_jameyaId_fkey" FOREIGN KEY ("jameyaId") REFERENCES "Jameya"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JameyaShare" ADD CONSTRAINT "JameyaShare_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JameyaShare" ADD CONSTRAINT "JameyaShare_jameyaId_fkey" FOREIGN KEY ("jameyaId") REFERENCES "Jameya"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JameyaShare" ADD CONSTRAINT "JameyaShare_cycleId_fkey" FOREIGN KEY ("cycleId") REFERENCES "JameyaCycle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JameyaShare" ADD CONSTRAINT "JameyaShare_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JameyaDue" ADD CONSTRAINT "JameyaDue_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JameyaDue" ADD CONSTRAINT "JameyaDue_jameyaId_fkey" FOREIGN KEY ("jameyaId") REFERENCES "Jameya"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JameyaDue" ADD CONSTRAINT "JameyaDue_cycleId_fkey" FOREIGN KEY ("cycleId") REFERENCES "JameyaCycle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JameyaDue" ADD CONSTRAINT "JameyaDue_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JameyaPayment" ADD CONSTRAINT "JameyaPayment_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JameyaPayment" ADD CONSTRAINT "JameyaPayment_jameyaId_fkey" FOREIGN KEY ("jameyaId") REFERENCES "Jameya"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JameyaPayment" ADD CONSTRAINT "JameyaPayment_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JameyaPaymentAllocation" ADD CONSTRAINT "JameyaPaymentAllocation_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "JameyaPayment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JameyaPaymentAllocation" ADD CONSTRAINT "JameyaPaymentAllocation_dueId_fkey" FOREIGN KEY ("dueId") REFERENCES "JameyaDue"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JameyaPayout" ADD CONSTRAINT "JameyaPayout_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JameyaPayout" ADD CONSTRAINT "JameyaPayout_jameyaId_fkey" FOREIGN KEY ("jameyaId") REFERENCES "Jameya"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JameyaPayout" ADD CONSTRAINT "JameyaPayout_cycleId_fkey" FOREIGN KEY ("cycleId") REFERENCES "JameyaCycle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JameyaPayout" ADD CONSTRAINT "JameyaPayout_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddCheckConstraint
ALTER TABLE "Jameya" ADD CONSTRAINT "Jameya_shareAmount_positive" CHECK ("shareAmount" > 0);

-- AddCheckConstraint
ALTER TABLE "Jameya" ADD CONSTRAINT "Jameya_shareCount_at_least_two" CHECK ("shareCount" >= 2);

-- AddCheckConstraint
ALTER TABLE "Jameya" ADD CONSTRAINT "Jameya_graceDays_not_negative" CHECK ("graceDays" >= 0);

-- AddCheckConstraint
ALTER TABLE "JameyaShare" ADD CONSTRAINT "JameyaShare_halves_valid" CHECK ("halves" IN (1, 2));

-- AddCheckConstraint
ALTER TABLE "JameyaDue" ADD CONSTRAINT "JameyaDue_paidAmount_within_amount" CHECK ("paidAmount" >= 0 AND "paidAmount" <= "amount");

-- AddCheckConstraint
ALTER TABLE "JameyaPayment" ADD CONSTRAINT "JameyaPayment_amount_positive" CHECK ("amount" > 0);

-- AddCheckConstraint
ALTER TABLE "JameyaPaymentAllocation" ADD CONSTRAINT "JameyaPaymentAllocation_amount_positive" CHECK ("amount" > 0);

-- AddCheckConstraint
ALTER TABLE "JameyaPayout" ADD CONSTRAINT "JameyaPayout_amount_positive" CHECK ("amount" > 0);

-- AddCheckConstraint
ALTER TABLE "JameyaPayout" ADD CONSTRAINT "JameyaPayout_coveredAmount_within_amount" CHECK ("coveredAmount" >= 0 AND "coveredAmount" <= "amount");
