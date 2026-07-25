-- AlterTable
ALTER TABLE "SupportMessage" ADD COLUMN "adminReply" TEXT,
ADD COLUMN "repliedAt" TIMESTAMP(3),
ADD COLUMN "seenAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "SupportMessage_tenantId_userId_idx" ON "SupportMessage"("tenantId", "userId");
