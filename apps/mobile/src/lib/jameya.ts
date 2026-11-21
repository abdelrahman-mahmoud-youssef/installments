import {
  JameyaCycle,
  JameyaDetail,
  JameyaDue,
  JameyaMember,
  JameyaPayout,
  JameyaStatus,
} from '@/api/jameyas';
import { BadgeTone } from '@/components/ui/badge';

export type JameyaDueCellKind = 'paid' | 'partial' | 'late' | 'due' | 'upcoming';

export const JAMEYA_DUE_CELL_KINDS: JameyaDueCellKind[] = ['paid', 'partial', 'late', 'due', 'upcoming'];

export const jameyaStatusTone: Record<JameyaStatus, BadgeTone> = {
  ACTIVE: 'info',
  COMPLETED: 'success',
  CANCELLED: 'neutral',
};

export const jameyaDueCellTone: Record<JameyaDueCellKind, BadgeTone> = {
  paid: 'success',
  partial: 'warning',
  late: 'danger',
  due: 'info',
  upcoming: 'neutral',
};

export function jameyaMemberName(jameya: Pick<JameyaDetail, 'members'>, customerId: string): string {
  return jameya.members.find((member) => member.customerId === customerId)?.name ?? '';
}

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

export function holderNamesOf(jameya: Pick<JameyaDetail, 'members'>, cycle: JameyaCycle): string {
  return cycle.holders.map((holder) => jameyaMemberName(jameya, holder.customerId)).join(' · ');
}

export function canHandOverCycle(jameya: Pick<JameyaDetail, 'status'>, cycle: JameyaCycle): boolean {
  return jameya.status === 'ACTIVE' && cycle.state !== 'UPCOMING' && owedToHolders(cycle) > 0;
}

export function dueCellKind(due: JameyaDue, cycle: Pick<JameyaCycle, 'state'>): JameyaDueCellKind {
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

export function duesByCell(dues: JameyaDue[]): Map<string, JameyaDue> {
  return new Map(dues.map((due) => [dueCellKey(due.cycleId, due.customerId), due]));
}

export function dueCellKey(cycleId: string, customerId: string): string {
  return `${cycleId}:${customerId}`;
}

export function hasReceivedAndIsLate(member: Pick<JameyaMember, 'receivedAmount' | 'lateAmount'>): boolean {
  return member.receivedAmount > 0 && member.lateAmount > 0;
}

export function availableCycleCash(cycle: Pick<JameyaCycle, 'collectedAmount' | 'paidOutAmount'>): number {
  return Math.max(0, cycle.collectedAmount - cycle.paidOutAmount);
}

export function suggestedPayoutAmount(holderRemainingAmount: number, availableCash: number): number {
  return Math.min(holderRemainingAmount, availableCash);
}

export function amountFromShopMoney(amount: number, availableCash: number): number {
  return Math.max(0, amount - availableCash);
}

export function payoutsWithRemaining(
  cycle: Pick<JameyaCycle, 'holders' | 'payouts'>,
): { payout: JameyaPayout; remainingAmount: number }[] {
  const paidSoFar = new Map<string, number>();
  return cycle.payouts.map((payout) => {
    const entitlement = cycle.holders.find((holder) => holder.customerId === payout.customerId)?.entitlementAmount ?? 0;
    const paid = (paidSoFar.get(payout.customerId) ?? 0) + payout.amount;
    paidSoFar.set(payout.customerId, paid);
    return { payout, remainingAmount: entitlement - paid };
  });
}
