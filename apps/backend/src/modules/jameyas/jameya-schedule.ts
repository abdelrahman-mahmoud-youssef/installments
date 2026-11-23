import { RecurrenceType } from '@prisma/client';
import { addUtcDays } from '../../common/date/utc-date';
import { generateDueDates } from '../../common/installments/recurrence';
import { isWholePounds, splitEqually } from './jameya-amounts';

export class InvalidJameyaTurnsError extends Error {}

export interface RequestedTurnHolder {
  customerId: string;
  contribution?: number;
}

export interface RequestedTurn {
  holders: RequestedTurnHolder[];
}

export interface JameyaTurnHolder {
  customerId: string;
  contribution: number;
}

export interface JameyaScheduleInput {
  shareAmount: number;
  recurrenceType: RecurrenceType;
  firstDueDate: Date;
  graceDays: number;
  turns: RequestedTurn[];
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

function assertHoldersAreDistinct(holders: RequestedTurnHolder[]): void {
  if (new Set(holders.map((holder) => holder.customerId)).size !== holders.length) {
    throw new InvalidJameyaTurnsError('A customer can appear only once in the same turn.');
  }
}

function resolveContributions(shareAmount: number, holders: RequestedTurnHolder[]): number[] {
  const contributions = holders.flatMap((holder) => (holder.contribution === undefined ? [] : [holder.contribution]));
  if (contributions.length === 0) {
    return splitEqually(shareAmount, holders.length);
  }
  if (contributions.length !== holders.length) {
    throw new InvalidJameyaTurnsError('Either every holder in a turn has an amount or none does.');
  }
  if (contributions.some((contribution) => contribution <= 0 || !isWholePounds(contribution))) {
    throw new InvalidJameyaTurnsError('Every amount in a turn must be a positive whole number of pounds.');
  }
  if (contributions.reduce((total, contribution) => total + contribution, 0) !== shareAmount) {
    throw new InvalidJameyaTurnsError('The amounts in every turn must add up to exactly the share amount.');
  }
  return contributions;
}

export function resolveTurnHolders(shareAmount: number, turn: RequestedTurn): JameyaTurnHolder[] {
  assertHoldersAreDistinct(turn.holders);
  const contributions = resolveContributions(shareAmount, turn.holders);
  return turn.holders.map((holder, index) => ({ customerId: holder.customerId, contribution: contributions[index] }));
}

function totalContributionByCustomer(turns: JameyaTurnHolder[][]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const holder of turns.flat()) {
    totals.set(holder.customerId, (totals.get(holder.customerId) ?? 0) + holder.contribution);
  }
  return totals;
}

export function buildJameyaSchedule(input: JameyaScheduleInput): JameyaSchedule {
  if (!isWholePounds(input.shareAmount)) {
    throw new InvalidJameyaTurnsError('The share amount must be a whole number of pounds.');
  }
  const turns = input.turns.map((turn) => resolveTurnHolders(input.shareAmount, turn));

  const dueDates = generateDueDates({
    firstPaymentDate: input.firstDueDate,
    recurrenceType: input.recurrenceType,
    installmentCount: turns.length,
  });
  const cycles = turns.map((holders, index) => ({
    sequence: index + 1,
    dueDate: dueDates[index],
    lateAfter: addUtcDays(dueDates[index], input.graceDays),
    holders,
  }));

  const dueAmounts = [...totalContributionByCustomer(turns)].map(([customerId, amount]) => ({ customerId, amount }));
  const dues = cycles.flatMap((cycle) => dueAmounts.map((due) => ({ sequence: cycle.sequence, ...due })));

  return { cycles, dueAmounts, dues };
}
