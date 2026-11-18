export const HALVES_PER_SHARE = 2;

export function calculatePot(shareAmount: number, shareCount: number): number {
  return shareAmount * shareCount;
}

export function calculateEntitlement(pot: number, halves: number): number {
  return (pot * halves) / HALVES_PER_SHARE;
}

export function calculateDueAmount(shareAmount: number, totalHalves: number): number {
  return (shareAmount * totalHalves) / HALVES_PER_SHARE;
}

export function calculateExposure(paidOut: number, collected: number): number {
  return Math.max(0, paidOut - collected);
}

export interface CoveredAmountInput {
  collected: number;
  paidOutBefore: number;
  amount: number;
}

export function calculateCoveredAmount({ collected, paidOutBefore, amount }: CoveredAmountInput): number {
  return calculateExposure(paidOutBefore + amount, collected) - calculateExposure(paidOutBefore, collected);
}
