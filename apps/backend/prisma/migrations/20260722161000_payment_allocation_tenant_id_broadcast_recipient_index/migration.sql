-- PaymentAllocation.tenantId: defense-in-depth. Every current query reaches
-- this table only through an already-tenant-verified Payment/Contract
-- relation, but a direct column matches every other tenant-owned table.
ALTER TABLE "PaymentAllocation" ADD COLUMN "tenantId" TEXT;

UPDATE "PaymentAllocation" pa
SET "tenantId" = p."tenantId"
FROM "Payment" p
WHERE pa."paymentId" = p."id";

ALTER TABLE "PaymentAllocation" ALTER COLUMN "tenantId" SET NOT NULL;

CREATE INDEX "PaymentAllocation_tenantId_idx" ON "PaymentAllocation"("tenantId");

-- BroadcastRecipient.tenantId already exists as a column; no query filters
-- by it directly today (everything scopes through broadcastId), but it's
-- unindexed -- adding for consistency with every other tenant-owned table.
CREATE INDEX "BroadcastRecipient_tenantId_idx" ON "BroadcastRecipient"("tenantId");
