-- Dedupe existing PaymentMethod rows sharing the same (tenantId, presetKey, details)
-- before the unique constraint below would reject them. Keeps the oldest row per
-- triple; custom methods (presetKey IS NULL) and same-provider entries with
-- different account details are left untouched.
WITH ranked AS (
  SELECT id, ROW_NUMBER() OVER (
    PARTITION BY "tenantId", "presetKey", "details"
    ORDER BY "createdAt" ASC, id ASC
  ) AS rn
  FROM "PaymentMethod"
  WHERE "presetKey" IS NOT NULL
)
DELETE FROM "PaymentMethod"
WHERE id IN (SELECT id FROM ranked WHERE rn > 1);

-- CreateIndex
CREATE UNIQUE INDEX "PaymentMethod_tenantId_presetKey_details_key" ON "PaymentMethod"("tenantId", "presetKey", "details");
