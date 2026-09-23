import type { CalculationMethod, RecurrenceType } from '@/api/contracts';
import { shiftIsoDate, shiftIsoDateByMonths } from './calendar';

const DAYS_PER_WEEK = 7;
const DAYS_PER_TWO_WEEKS = 14;
const PERCENT = 100;

export interface ScheduleInput {
  calculationMethod: CalculationMethod;
  productPrice: number;
  downPayment: number;
  markupPercent?: number;
  installmentCount?: number;
  fixedInstallmentAmount?: number;
}

export interface SchedulePreview {
  totalAmount: number;
  financedAmount: number;
  installmentAmounts: number[];
}

export interface DueDateInput {
  firstPaymentDate: string;
  recurrenceType: RecurrenceType;
  count: number;
  intervalDays?: number;
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

function computeTotals(input: ScheduleInput): { totalAmount: number; financedAmount: number } {
  if (input.calculationMethod === 'MARKUP_PERCENT') {
    const financedBase = Math.max(input.productPrice - input.downPayment, 0);
    const financedAmount = Math.round(financedBase * (1 + (input.markupPercent ?? 0) / PERCENT));
    return { totalAmount: input.downPayment + financedAmount, financedAmount };
  }
  return { totalAmount: input.productPrice, financedAmount: input.productPrice - input.downPayment };
}

export function calculateSchedulePreview(input: ScheduleInput): SchedulePreview | null {
  const { totalAmount, financedAmount } = computeTotals(input);
  if (financedAmount <= 0) {
    return null;
  }
  if (input.calculationMethod === 'FIXED_AMOUNT') {
    if (!input.fixedInstallmentAmount || input.fixedInstallmentAmount <= 0) {
      return null;
    }
    return {
      totalAmount,
      financedAmount,
      installmentAmounts: distributeByFixedAmount(financedAmount, input.fixedInstallmentAmount),
    };
  }
  if (!input.installmentCount || input.installmentCount <= 0) {
    return null;
  }
  return { totalAmount, financedAmount, installmentAmounts: distributeEvenly(financedAmount, input.installmentCount) };
}

function recurrenceStepDays(recurrenceType: RecurrenceType, intervalDays?: number): number {
  if (recurrenceType === 'WEEKLY') {
    return DAYS_PER_WEEK;
  }
  if (recurrenceType === 'BIWEEKLY') {
    return DAYS_PER_TWO_WEEKS;
  }
  return intervalDays ?? 0;
}

export function generateDueDates({ firstPaymentDate, recurrenceType, count, intervalDays }: DueDateInput): string[] {
  if (recurrenceType === 'MONTHLY') {
    return Array.from({ length: count }, (_, index) => shiftIsoDateByMonths(firstPaymentDate, index));
  }
  const stepDays = recurrenceStepDays(recurrenceType, intervalDays);
  if (stepDays <= 0) {
    return [];
  }
  return Array.from({ length: count }, (_, index) => shiftIsoDate(firstPaymentDate, index * stepDays));
}
