-- CreateEnum
CREATE TYPE "WalletAccess" AS ENUM ('NONE', 'ALL', 'SELECTED');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "walletAccess" "WalletAccess" NOT NULL DEFAULT 'NONE';

-- CreateTable
CREATE TABLE "StaffWalletGrant" (
    "userId" TEXT NOT NULL,
    "paymentMethodId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StaffWalletGrant_pkey" PRIMARY KEY ("userId","paymentMethodId")
);

-- CreateIndex
CREATE INDEX "StaffWalletGrant_paymentMethodId_idx" ON "StaffWalletGrant"("paymentMethodId");

-- CreateIndex
CREATE INDEX "StaffWalletGrant_tenantId_idx" ON "StaffWalletGrant"("tenantId");

-- AddForeignKey
ALTER TABLE "StaffWalletGrant" ADD CONSTRAINT "StaffWalletGrant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffWalletGrant" ADD CONSTRAINT "StaffWalletGrant_paymentMethodId_fkey" FOREIGN KEY ("paymentMethodId") REFERENCES "PaymentMethod"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffWalletGrant" ADD CONSTRAINT "StaffWalletGrant_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

