import { apiClient, buildQuery, PaginatedResult } from './client';

export type MoneyDirection = 'IN' | 'OUT';

export interface PaymentMethodTransaction {
  id: string;
  direction: MoneyDirection;
  amount: number;
  counterpartyId: string | null;
  counterpartyName: string | null;
  counterpartyPhone: string | null;
  receiptUrl: string | null;
  note: string | null;
  occurredAt: string;
  createdAt: string;
}

export type PaymentMethodTransactionListParams = {
  month?: string;
  q?: string;
  page?: number;
  limit?: number;
};

export interface DirectionTotals {
  totalIn: number;
  totalOut: number;
}

export type PaymentMethodTransactionListResult = PaginatedResult<PaymentMethodTransaction> & DirectionTotals;

export interface PaymentMethodMonthlySummary {
  paymentTotal: number;
  receivedTotal: number;
  sentTotal: number;
  total: number;
  monthlyLimit: number | null;
}

export interface CreatePaymentMethodTransactionInput {
  direction: MoneyDirection;
  amount: number;
  occurredAt: string;
  counterpartyId?: string;
  counterpartyName?: string;
  counterpartyPhone?: string;
  note?: string;
  image?: string;
}

export function listPaymentMethodTransactions(
  paymentMethodId: string,
  params: PaymentMethodTransactionListParams,
): Promise<PaymentMethodTransactionListResult> {
  return apiClient.get(`settings/payment-methods/${paymentMethodId}/transactions${buildQuery(params)}`);
}

export function getPaymentMethodMonthlySummary(
  paymentMethodId: string,
  month: string,
): Promise<PaymentMethodMonthlySummary> {
  return apiClient.get(`settings/payment-methods/${paymentMethodId}/transactions/summary${buildQuery({ month })}`);
}

export function createPaymentMethodTransaction(
  paymentMethodId: string,
  input: CreatePaymentMethodTransactionInput,
): Promise<PaymentMethodTransaction> {
  return apiClient.post(`settings/payment-methods/${paymentMethodId}/transactions`, input);
}
