-- CreateEnum
CREATE TYPE "BroadcastRecipientStatus" AS ENUM ('PENDING', 'SENT', 'FAILED');

-- CreateTable
CREATE TABLE "BroadcastRecipient" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "broadcastId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "status" "BroadcastRecipientStatus" NOT NULL DEFAULT 'PENDING',
    "sentAt" TIMESTAMP(3),
    "error" TEXT,

    CONSTRAINT "BroadcastRecipient_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BroadcastRecipient_broadcastId_status_idx" ON "BroadcastRecipient"("broadcastId", "status");

-- CreateIndex
CREATE INDEX "BroadcastRecipient_customerId_idx" ON "BroadcastRecipient"("customerId");

-- AddForeignKey
ALTER TABLE "BroadcastRecipient" ADD CONSTRAINT "BroadcastRecipient_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BroadcastRecipient" ADD CONSTRAINT "BroadcastRecipient_broadcastId_fkey" FOREIGN KEY ("broadcastId") REFERENCES "Broadcast"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BroadcastRecipient" ADD CONSTRAINT "BroadcastRecipient_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Backfill: historical SELECTED-audience broadcasts stored their target ids
-- directly, so we can materialize recipient rows for them. Broadcasts that
-- had zero recorded failures are marked SENT with confidence; broadcasts
-- that had any recorded failures cannot have their specific failures
-- attributed to individual customers (that detail was never stored), so
-- all of their target ids are also backfilled as SENT as a one-time,
-- historical-only approximation. ALL-audience broadcasts never stored a
-- target list at all and cannot be backfilled with any rows.
INSERT INTO "BroadcastRecipient" ("id", "tenantId", "broadcastId", "customerId", "status", "sentAt")
SELECT
  gen_random_uuid()::text,
  b."tenantId",
  b."id",
  target."customerId",
  'SENT',
  b."createdAt"
FROM "Broadcast" b, LATERAL unnest(b."targetCustomerIds") AS target("customerId")
WHERE b."audience" = 'SELECTED';

-- AlterTable
ALTER TABLE "Broadcast" DROP COLUMN "targetCustomerIds";
ALTER TABLE "Broadcast" DROP COLUMN "recipientCount";
ALTER TABLE "Broadcast" DROP COLUMN "sentCount";
ALTER TABLE "Broadcast" DROP COLUMN "failedCount";
