-- CreateEnum
CREATE TYPE "PushNotificationKind" AS ENUM ('SUBSCRIPTION_EXPIRING', 'SUBSCRIPTION_EXPIRED', 'ANNOUNCEMENT');

-- CreateEnum
CREATE TYPE "PushAudience" AS ENUM ('ALL', 'EXPIRING_SOON', 'EXPIRED', 'SHOP');

-- CreateTable
CREATE TABLE "PushDevice" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "language" "NotificationLanguage" NOT NULL DEFAULT 'AR',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PushDevice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PushNotificationLog" (
    "id" TEXT NOT NULL,
    "kind" "PushNotificationKind" NOT NULL,
    "audience" "PushAudience",
    "tenantId" TEXT,
    "dedupeKey" TEXT,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "recipientCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PushNotificationLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PushDevice_token_key" ON "PushDevice"("token");

-- CreateIndex
CREATE INDEX "PushDevice_tenantId_idx" ON "PushDevice"("tenantId");

-- CreateIndex
CREATE INDEX "PushDevice_userId_idx" ON "PushDevice"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "PushNotificationLog_dedupeKey_key" ON "PushNotificationLog"("dedupeKey");

-- CreateIndex
CREATE INDEX "PushNotificationLog_kind_createdAt_idx" ON "PushNotificationLog"("kind", "createdAt");

-- CreateIndex
CREATE INDEX "PushNotificationLog_tenantId_idx" ON "PushNotificationLog"("tenantId");

-- AddForeignKey
ALTER TABLE "PushDevice" ADD CONSTRAINT "PushDevice_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PushDevice" ADD CONSTRAINT "PushDevice_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PushNotificationLog" ADD CONSTRAINT "PushNotificationLog_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

