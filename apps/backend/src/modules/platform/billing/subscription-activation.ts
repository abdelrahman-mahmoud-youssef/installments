import { SubscriptionPaymentMethod } from '@prisma/client';

export type SubscriptionActivationItem =
  | { source: 'PLAN'; planId: string }
  | { source: 'OFFER'; offerId: string }
  | { source: 'MANUAL'; months: number; amount: number };

export interface SubscriptionPaymentDetails {
  amount?: number;
  paidAt: Date;
  paymentMethod: SubscriptionPaymentMethod;
  reference?: string;
  note?: string;
}

export interface ResolvedSubscriptionItem {
  months: number;
  listPrice: number;
  price: number;
  planId: string | null;
  offerId: string | null;
}
