import { CalculationMethod } from '@prisma/client';

export interface ScheduleInput {
  calculationMethod: CalculationMethod;
  productPrice: number;
  downPayment: number;
  markupPercent?: number;
  installmentCount?: number;
  fixedInstallmentAmount?: number;
}

export interface ScheduleResult {
  totalAmount: number;
  installmentAmounts: number[];
}

function distributeEvenly(remaining: number, count: number): number[] {
  const baseAmount = Math.floor(remaining / count);
  const amounts = Array<number>(count).fill(baseAmount);
  amounts[count - 1] += remaining - baseAmount * count;
  return amounts;
}

function distributeByFixedAmount(remaining: number, fixedAmount: number): number[] {
  const fullInstallmentCount = Math.floor(remaining / fixedAmount);
  const finalInstallmentAmount = remaining - fixedAmount * fullInstallmentCount;
  const amounts = Array<number>(fullInstallmentCount).fill(fixedAmount);
  if (finalInstallmentAmount > 0) {
    amounts.push(finalInstallmentAmount);
  }
  return amounts;
}

interface ContractTotals {
  totalAmount: number;
  remaining: number;
}

function computeTotals(input: ScheduleInput): ContractTotals {
  if (input.calculationMethod === CalculationMethod.MARKUP_PERCENT) {
    if (!input.markupPercent || input.markupPercent <= 0) {
      throw new Error('markupPercent is required for the MARKUP_PERCENT calculation method.');
    }
    const financedBase = input.productPrice - input.downPayment;
    const markedUpBalance = Math.round(Math.max(financedBase, 0) * (1 + input.markupPercent / 100));
    return { totalAmount: input.downPayment + markedUpBalance, remaining: markedUpBalance };
  }
  return { totalAmount: input.productPrice, remaining: input.productPrice - input.downPayment };
}

export function calculateInstallmentSchedule(input: ScheduleInput): ScheduleResult {
  const { totalAmount, remaining } = computeTotals(input);

  if (remaining <= 0) {
    throw new Error('The remaining amount after the down payment must be greater than zero.');
  }

  if (input.calculationMethod === CalculationMethod.FIXED_AMOUNT) {
    if (!input.fixedInstallmentAmount || input.fixedInstallmentAmount <= 0) {
      throw new Error('fixedInstallmentAmount is required for the FIXED_AMOUNT calculation method.');
    }
    return { totalAmount, installmentAmounts: distributeByFixedAmount(remaining, input.fixedInstallmentAmount) };
  }

  if (!input.installmentCount || input.installmentCount <= 0) {
    throw new Error(
      'installmentCount is required for the FIXED_COUNT and MARKUP_PERCENT calculation methods.',
    );
  }
  return { totalAmount, installmentAmounts: distributeEvenly(remaining, input.installmentCount) };
}
