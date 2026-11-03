-- AlterTable
ALTER TABLE "SupportMessage" ADD COLUMN "imageUrl" TEXT;

-- CreateIndex
CREATE INDEX "SupportMessage_repliedAt_createdAt_idx" ON "SupportMessage"("repliedAt", "createdAt");
