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

function calculateTotalAmount(input: ScheduleInput): number {
  if (input.calculationMethod !== CalculationMethod.MARKUP_PERCENT) {
    return input.productPrice;
  }
  if (!input.markupPercent || input.markupPercent <= 0) {
    throw new Error('markupPercent is required for the MARKUP_PERCENT calculation method.');
  }
  return Math.round(input.productPrice * (1 + input.markupPercent / 100));
}

export function calculateInstallmentSchedule(input: ScheduleInput): ScheduleResult {
  const totalAmount = calculateTotalAmount(input);
  const remaining = totalAmount - input.downPayment;

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
