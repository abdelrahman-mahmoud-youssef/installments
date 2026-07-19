export interface MarkupEstimateInput {
  productPriceMinor: number;
  downPaymentMinor: number;
  markupPercent: number;
  months: number;
}

export interface MarkupEstimateResult {
  totalAmountMinor: number;
  monthlyPaymentMinor: number;
}

export function estimateMarkupInstallment(input: MarkupEstimateInput): MarkupEstimateResult {
  const financedBase = Math.max(input.productPriceMinor - input.downPaymentMinor, 0);
  const markedUpBalance = Math.round(financedBase * (1 + input.markupPercent / 100));
  const totalAmountMinor = input.downPaymentMinor + markedUpBalance;
  const monthlyPaymentMinor = input.months > 0 ? Math.round(markedUpBalance / input.months) : 0;
  return { totalAmountMinor, monthlyPaymentMinor };
}
