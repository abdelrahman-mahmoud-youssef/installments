import { RecurrenceType } from '@prisma/client';
import { addUtcDays } from '../../common/date/utc-date';
import { generateDueDates } from '../../common/installments/recurrence';
import { calculateDueAmount, HALVES_PER_SHARE } from './jameya-amounts';

export interface JameyaTurnHolder {
  customerId: string;
  halves: number;
}

export interface JameyaScheduleInput {
  shareAmount: number;
  recurrenceType: RecurrenceType;
  firstDueDate: Date;
  graceDays: number;
  turns: JameyaTurnHolder[][];
}

export interface PlannedCycle {
  sequence: number;
  dueDate: Date;
  lateAfter: Date;
  holders: JameyaTurnHolder[];
}

export interface PlannedDue {
  sequence: number;
  customerId: string;
  amount: number;
}

export interface PlannedDueAmount {
  customerId: string;
  amount: number;
}

export interface JameyaSchedule {
  cycles: PlannedCycle[];
  dueAmounts: PlannedDueAmount[];
  dues: PlannedDue[];
}

function sumHalves(holders: JameyaTurnHolder[]): number {
  return holders.reduce((total, holder) => total + holder.halves, 0);
}

function assertTurnsAreWhole(input: JameyaScheduleInput): void {
  if (input.turns.some((holders) => sumHalves(holders) !== HALVES_PER_SHARE)) {
    throw new Error('Every turn must add up to exactly one full share.');
  }
  const hasHalfShares = input.turns.some((holders) => holders.some((holder) => holder.halves !== HALVES_PER_SHARE));
  if (hasHalfShares && input.shareAmount % HALVES_PER_SHARE !== 0) {
    throw new Error('The share amount must split evenly into two halves.');
  }
}

function totalHalvesByCustomer(turns: JameyaTurnHolder[][]): Map<string, number> {
  const halvesByCustomer = new Map<string, number>();
  for (const holder of turns.flat()) {
    halvesByCustomer.set(holder.customerId, (halvesByCustomer.get(holder.customerId) ?? 0) + holder.halves);
  }
  return halvesByCustomer;
}

export function buildJameyaSchedule(input: JameyaScheduleInput): JameyaSchedule {
  assertTurnsAreWhole(input);

  const dueDates = generateDueDates({
    firstPaymentDate: input.firstDueDate,
    recurrenceType: input.recurrenceType,
    installmentCount: input.turns.length,
  });
  const cycles = input.turns.map((holders, index) => ({
    sequence: index + 1,
    dueDate: dueDates[index],
    lateAfter: addUtcDays(dueDates[index], input.graceDays),
    holders,
  }));

  const dueAmounts = [...totalHalvesByCustomer(input.turns)].map(([customerId, halves]) => ({
    customerId,
    amount: calculateDueAmount(input.shareAmount, halves),
  }));
  const dues = cycles.flatMap((cycle) => dueAmounts.map((due) => ({ sequence: cycle.sequence, ...due })));

  return { cycles, dueAmounts, dues };
}
