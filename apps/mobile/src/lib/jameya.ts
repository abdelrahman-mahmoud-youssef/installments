import {
  JameyaCycle,
  JameyaCycleState,
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

export const jameyaCycleStateTone: Record<JameyaCycleState, BadgeTone> = {
  UPCOMING: 'neutral',
  DUE: 'info',
  LATE: 'danger',
  PARTIALLY_PAID_OUT: 'warning',
  PAID_OUT: 'info',
  SETTLED: 'success',
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

export function currentJameyaCycle(jameya: Pick<JameyaDetail, 'cycles'>): JameyaCycle | undefined {
  return jameya.cycles.find((cycle) => cycle.state !== 'SETTLED');
}

export function canHandOverCycle(jameya: Pick<JameyaDetail, 'status'>, cycle: JameyaCycle): boolean {
  return (
    jameya.status === 'ACTIVE' &&
    cycle.state !== 'UPCOMING' &&
    cycle.holders.some((holder) => holder.remainingAmount > 0)
  );
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
