import { JAMEYA_WHOLE_POUND } from '../../common/constants';

export function calculatePot(shareAmount: number, shareCount: number): number {
  return shareAmount * shareCount;
}

export function calculateEntitlement(contribution: number, shareCount: number): number {
  return contribution * shareCount;
}

export function isWholePounds(amount: number): boolean {
  return Number.isInteger(amount) && amount % JAMEYA_WHOLE_POUND === 0;
}

export function splitEqually(shareAmount: number, holderCount: number): number[] {
  const pounds = shareAmount / JAMEYA_WHOLE_POUND;
  const basePounds = Math.floor(pounds / holderCount);
  const remainderPounds = pounds - basePounds * holderCount;
  return Array.from(
    { length: holderCount },
    (_, index) => (basePounds + (index < remainderPounds ? 1 : 0)) * JAMEYA_WHOLE_POUND,
  );
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
