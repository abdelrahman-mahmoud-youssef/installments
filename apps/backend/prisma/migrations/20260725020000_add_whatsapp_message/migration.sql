-- CreateTable
CREATE TABLE "WhatsappMessage" (
    "id" TEXT NOT NULL,
    "fromPhone" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "body" TEXT,
    "messageId" TEXT NOT NULL,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WhatsappMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WhatsappMessage_messageId_key" ON "WhatsappMessage"("messageId");

-- CreateIndex
CREATE INDEX "WhatsappMessage_fromPhone_receivedAt_idx" ON "WhatsappMessage"("fromPhone", "receivedAt");
