-- AlterTable
ALTER TABLE "JameyaShare" ADD COLUMN "contribution" INTEGER;

-- Backfill
UPDATE "JameyaShare" AS share
SET "contribution" = jameya."shareAmount" * share."halves" / 2
FROM "Jameya" AS jameya
WHERE jameya."id" = share."jameyaId";

-- Guard
DO $$
DECLARE
  uneven_shares INTEGER;
  partial_pound_shares INTEGER;
  partial_pound_share_amounts INTEGER;
  partial_pound_payments INTEGER;
  partial_pound_payouts INTEGER;
BEGIN
  SELECT COUNT(*) INTO uneven_shares
  FROM "JameyaShare" AS share JOIN "Jameya" AS jameya ON jameya."id" = share."jameyaId"
  WHERE (jameya."shareAmount" * share."halves") % 2 <> 0;

  SELECT COUNT(*) INTO partial_pound_shares FROM "JameyaShare" WHERE "contribution" IS NULL OR "contribution" % 100 <> 0;
  SELECT COUNT(*) INTO partial_pound_share_amounts FROM "Jameya" WHERE "shareAmount" % 100 <> 0;
  SELECT COUNT(*) INTO partial_pound_payments FROM "JameyaPayment" WHERE "amount" % 100 <> 0;
  SELECT COUNT(*) INTO partial_pound_payouts FROM "JameyaPayout" WHERE "amount" % 100 <> 0;

  IF uneven_shares + partial_pound_shares + partial_pound_share_amounts + partial_pound_payments + partial_pound_payouts > 0 THEN
    RAISE EXCEPTION 'Jameya amounts must be whole pounds before switching to contributions. Shares that do not split evenly: %, shares that are not whole pounds: %, jameyas whose share amount is not whole pounds: %, payments not in whole pounds: %, payouts not in whole pounds: %. Fix these rows by hand, then run the migration again.',
      uneven_shares, partial_pound_shares, partial_pound_share_amounts, partial_pound_payments, partial_pound_payouts;
  END IF;
END $$;

-- AlterTable
ALTER TABLE "JameyaShare" ALTER COLUMN "contribution" SET NOT NULL;

-- AddCheckConstraint
ALTER TABLE "JameyaShare" ADD CONSTRAINT "JameyaShare_contribution_whole_pounds" CHECK ("contribution" > 0 AND "contribution" % 100 = 0);

-- AddCheckConstraint
ALTER TABLE "Jameya" ADD CONSTRAINT "Jameya_shareAmount_whole_pounds" CHECK ("shareAmount" % 100 = 0);

-- AddCheckConstraint
ALTER TABLE "JameyaPayment" ADD CONSTRAINT "JameyaPayment_amount_whole_pounds" CHECK ("amount" % 100 = 0);

-- AddCheckConstraint
ALTER TABLE "JameyaPayout" ADD CONSTRAINT "JameyaPayout_amount_whole_pounds" CHECK ("amount" % 100 = 0);

-- DropCheckConstraint
ALTER TABLE "JameyaShare" DROP CONSTRAINT "JameyaShare_halves_valid";

-- AlterTable
ALTER TABLE "JameyaShare" DROP COLUMN "halves";
