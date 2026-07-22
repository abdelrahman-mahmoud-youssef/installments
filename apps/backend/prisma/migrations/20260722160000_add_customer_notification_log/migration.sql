-- CreateTable
CREATE TABLE "CustomerNotificationLog" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "channel" "ReminderChannel" NOT NULL DEFAULT 'TELEGRAM',
    "success" BOOLEAN NOT NULL,
    "error" TEXT,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CustomerNotificationLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CustomerNotificationLog_tenantId_customerId_sentAt_idx" ON "CustomerNotificationLog"("tenantId", "customerId", "sentAt");

-- AddForeignKey
ALTER TABLE "CustomerNotificationLog" ADD CONSTRAINT "CustomerNotificationLog_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerNotificationLog" ADD CONSTRAINT "CustomerNotificationLog_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
