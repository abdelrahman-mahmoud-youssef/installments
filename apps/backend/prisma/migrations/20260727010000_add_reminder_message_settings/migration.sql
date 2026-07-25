-- CreateTable
CREATE TABLE "ReminderMessageSettings" (
    "tenantId" TEXT NOT NULL,
    "showProgress" BOOLEAN NOT NULL DEFAULT true,
    "showRemaining" BOOLEAN NOT NULL DEFAULT true,
    "showLocation" BOOLEAN NOT NULL DEFAULT true,
    "showPayLink" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "ReminderMessageSettings_pkey" PRIMARY KEY ("tenantId")
);

-- AddForeignKey
ALTER TABLE "ReminderMessageSettings" ADD CONSTRAINT "ReminderMessageSettings_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
