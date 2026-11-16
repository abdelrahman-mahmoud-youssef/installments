-- AddCheckConstraint
ALTER TABLE "Installment" ADD CONSTRAINT "Installment_paidAmount_within_amount" CHECK ("paidAmount" >= 0 AND "paidAmount" <= "amount") NOT VALID;
