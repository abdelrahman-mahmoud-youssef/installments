import { JameyaCycle, JameyaDetail, JameyaDue } from '@/lib/api/jameyas';

export type JameyaDueKind = 'paid' | 'partial' | 'late' | 'due' | 'upcoming';

const TURNS_BEFORE_CURRENT = 2;
const TURNS_AFTER_CURRENT = 2;

export type JameyaTurnStatus =
  | { kind: 'current' }
  | { kind: 'paidOut' }
  | { kind: 'partlyPaidOut'; paidOutAmount: number; owedAmount: number }
  | { kind: 'later' };

function sumHolders(cycle: JameyaCycle, amountOf: (holder: JameyaCycle['holders'][number]) => number): number {
  return cycle.holders.reduce((total, holder) => total + amountOf(holder), 0);
}

function owedToHolders(cycle: JameyaCycle): number {
  return sumHolders(cycle, (holder) => holder.remainingAmount);
}

export function findCurrentTurn(jameya: Pick<JameyaDetail, 'cycles'>): JameyaCycle | undefined {
  return jameya.cycles.find((cycle) => owedToHolders(cycle) > 0);
}

export function turnsAroundCurrent(jameya: Pick<JameyaDetail, 'cycles'>): JameyaCycle[] {
  const current = findCurrentTurn(jameya);
  if (!current) {
    return jameya.cycles.slice(-TURNS_BEFORE_CURRENT);
  }
  const index = jameya.cycles.findIndex((cycle) => cycle.id === current.id);
  return jameya.cycles.slice(Math.max(0, index - TURNS_BEFORE_CURRENT), index + TURNS_AFTER_CURRENT + 1);
}

export function resolveTurnStatus(cycle: JameyaCycle, current: JameyaCycle | undefined): JameyaTurnStatus {
  if (cycle.id === current?.id) {
    return { kind: 'current' };
  }
  const owedAmount = owedToHolders(cycle);
  if (owedAmount === 0) {
    return { kind: 'paidOut' };
  }
  const paidOutAmount = sumHolders(cycle, (holder) => holder.paidOutAmount);
  return paidOutAmount > 0 ? { kind: 'partlyPaidOut', paidOutAmount, owedAmount } : { kind: 'later' };
}

export function canHandOverTurn(jameya: Pick<JameyaDetail, 'status'>, cycle: JameyaCycle): boolean {
  return jameya.status === 'ACTIVE' && cycle.state !== 'UPCOMING' && owedToHolders(cycle) > 0;
}

export function dueKindOf(due: JameyaDue, cycle: Pick<JameyaCycle, 'state'>): JameyaDueKind {
  if (due.status === 'PAID') {
    return 'paid';
  }
  if (due.isLate) {
    return 'late';
  }
  if (due.status === 'PARTIALLY_PAID') {
    return 'partial';
  }
  return cycle.state === 'UPCOMING' ? 'upcoming' : 'due';
}

export function suggestedPaymentOf(jameya: Pick<JameyaDetail, 'members'>, customerId: string): number {
  const member = jameya.members.find((item) => item.customerId === customerId);
  return member ? Math.min(member.monthlyAmount, member.remainingAmount) : 0;
}

export function availableCashOf(cycle: JameyaCycle): number {
  return Math.max(0, cycle.collectedAmount - cycle.paidOutAmount);
}

export function suggestedPayoutOf(cycle: JameyaCycle, customerId: string): number {
  const remainingAmount = cycle.holders.find((holder) => holder.customerId === customerId)?.remainingAmount ?? 0;
  return Math.min(remainingAmount, availableCashOf(cycle));
}

export function memberNameOf(jameya: Pick<JameyaDetail, 'members'>, customerId: string): string {
  return jameya.members.find((member) => member.customerId === customerId)?.name ?? '';
}

export function openHoldersOf(cycle: JameyaCycle): JameyaCycle['holders'] {
  return cycle.holders.filter((holder) => holder.remainingAmount > 0);
}
