-- CreateIndex
-- PaymentClaim.contractId is a foreign key with no dedicated index; Postgres
-- does not auto-index FK columns, so every contract-scoped lookup and every
-- FK-check on Contract writes/deletes pays a full table scan without this.
CREATE INDEX "PaymentClaim_tenantId_contractId_idx" ON "PaymentClaim"("tenantId", "contractId");

-- Enforce at the database level what schedule.ts / recurrence.ts already
-- enforce in application code: markupPercent is required (and positive) only
-- for MARKUP_PERCENT contracts, intervalDays only for EVERY_X_DAYS recurrence.
-- Prisma's schema DSL has no CHECK constraint support, so this constraint is
-- not represented in schema.prisma and only exists here.
ALTER TABLE "Contract" ADD CONSTRAINT "Contract_markupPercent_check"
  CHECK ("calculationMethod" != 'MARKUP_PERCENT' OR ("markupPercent" IS NOT NULL AND "markupPercent" > 0));

ALTER TABLE "Contract" ADD CONSTRAINT "Contract_intervalDays_check"
  CHECK ("recurrenceType" != 'EVERY_X_DAYS' OR ("intervalDays" IS NOT NULL AND "intervalDays" > 0));
