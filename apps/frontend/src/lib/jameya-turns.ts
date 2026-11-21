import { JameyaCycle, JameyaDetail } from '@/lib/api/jameyas';

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

export function holderNamesOf(jameya: Pick<JameyaDetail, 'members'>, cycle: JameyaCycle): string {
  return cycle.holders
    .map((holder) => jameya.members.find((member) => member.customerId === holder.customerId)?.name ?? '')
    .join(' · ');
}
