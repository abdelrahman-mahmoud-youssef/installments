import type { MoneyDirection } from '@/api/payment-method-transactions';

export type BalanceStatus = 'theyOwe' | 'youOwe' | 'settled';
export type BalanceTone = 'danger' | 'success' | 'muted';

export function balanceStatus(balance: number): BalanceStatus {
  if (balance > 0) {
    return 'theyOwe';
  }
  return balance < 0 ? 'youOwe' : 'settled';
}

export const balanceTone: Record<BalanceStatus, BalanceTone> = {
  theyOwe: 'danger',
  youOwe: 'success',
  settled: 'muted',
};

export function applyAdjustment(balance: number, direction: MoneyDirection, amount: number): number {
  return balance + (direction === 'OUT' ? amount : -amount);
}
