-- Replace the bare tenantId index with one matching the actual access
-- pattern (users.service.ts's listStaff filters by tenantId + role).
DROP INDEX "User_tenantId_idx";
CREATE INDEX "User_tenantId_role_idx" ON "User"("tenantId", "role");

-- PaymentClaim.paymentMethodId was an unindexed FK. deletePaymentMethod can
-- delete a PaymentMethod that still has claims referencing it (Restrict
-- default), so Postgres scans PaymentClaim on every delete attempt.
CREATE INDEX "PaymentClaim_paymentMethodId_idx" ON "PaymentClaim"("paymentMethodId");

-- Tenant.allocationStrategy / AllocationStrategy were never read anywhere in
-- the app (allocation.ts hardcodes oldest-first) -- dead scaffolding for a
-- pluggable strategy that was never wired up.
ALTER TABLE "Tenant" DROP COLUMN "allocationStrategy";
DROP TYPE "AllocationStrategy";
