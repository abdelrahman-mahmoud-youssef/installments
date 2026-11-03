-- AlterTable
ALTER TABLE "Tenant" ADD COLUMN "referredByTenantId" TEXT;

-- CreateIndex
CREATE INDEX "Tenant_referredByTenantId_idx" ON "Tenant"("referredByTenantId");

-- AddForeignKey
ALTER TABLE "Tenant" ADD CONSTRAINT "Tenant_referredByTenantId_fkey" FOREIGN KEY ("referredByTenantId") REFERENCES "Tenant"("id") ON DELETE SET NULL ON UPDATE CASCADE;
