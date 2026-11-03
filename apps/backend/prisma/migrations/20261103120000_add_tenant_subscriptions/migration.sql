-- AlterTable
ALTER TABLE "Tenant" ADD COLUMN "subscriptionExpiresOn" DATE NOT NULL DEFAULT (CURRENT_DATE + INTERVAL '1 month')::date;
ALTER TABLE "Tenant" ALTER COLUMN "subscriptionExpiresOn" DROP DEFAULT;

-- CreateTable
CREATE TABLE "PlatformAdmin" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "failedLoginAttempts" INTEGER NOT NULL DEFAULT 0,
    "lockedUntil" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlatformAdmin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TenantSubscription" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "periodStart" DATE NOT NULL,
    "periodEnd" DATE NOT NULL,
    "amount" INTEGER NOT NULL,
    "activatedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TenantSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Tenant_subscriptionExpiresOn_idx" ON "Tenant"("subscriptionExpiresOn");

-- CreateIndex
CREATE UNIQUE INDEX "PlatformAdmin_email_key" ON "PlatformAdmin"("email");

-- CreateIndex
CREATE INDEX "TenantSubscription_tenantId_createdAt_idx" ON "TenantSubscription"("tenantId", "createdAt");

-- CreateIndex
CREATE INDEX "TenantSubscription_activatedById_idx" ON "TenantSubscription"("activatedById");

-- AddForeignKey
ALTER TABLE "TenantSubscription" ADD CONSTRAINT "TenantSubscription_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TenantSubscription" ADD CONSTRAINT "TenantSubscription_activatedById_fkey" FOREIGN KEY ("activatedById") REFERENCES "PlatformAdmin"("id") ON DELETE SET NULL ON UPDATE CASCADE;
