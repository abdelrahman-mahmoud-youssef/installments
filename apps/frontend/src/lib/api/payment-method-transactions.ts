import { fileToBase64 } from '@/lib/file';
import { toMinorUnits } from '@/lib/format';
import { PaymentMethodTransactionInput } from '@/lib/schemas/payment-method-transaction';
import { apiClient } from './client';
import { buildQuery, PaginatedResult } from './pagination';

export interface PaymentMethodTransaction {
  id: string;
  direction: 'IN' | 'OUT';
  amount: number;
  counterpartyName: string | null;
  counterpartyPhone: string | null;
  receiptUrl: string | null;
  note: string | null;
  occurredAt: string;
  createdAt: string;
}

export interface PaymentMethodTransactionListParams {
  month?: string;
  page?: number;
  limit?: number;
  q?: string;
}

export interface PaymentMethodTransactionListResult extends PaginatedResult<PaymentMethodTransaction> {
  totalIn: number;
  totalOut: number;
}

export interface PaymentMethodMonthlySummary {
  paymentTotal: number;
  receivedTotal: number;
  sentTotal: number;
  total: number;
  monthlyLimit: number | null;
}

export function listPaymentMethodTransactions(
  paymentMethodId: string,
  params: PaymentMethodTransactionListParams,
): Promise<PaymentMethodTransactionListResult> {
  return apiClient.get(`settings/payment-methods/${paymentMethodId}/transactions${buildQuery(params)}`);
}

export function getPaymentMethodMonthlySummary(
  paymentMethodId: string,
  month?: string,
): Promise<PaymentMethodMonthlySummary> {
  return apiClient.get(`settings/payment-methods/${paymentMethodId}/transactions/summary${buildQuery({ month })}`);
}

export async function createPaymentMethodTransaction(
  paymentMethodId: string,
  input: PaymentMethodTransactionInput,
): Promise<PaymentMethodTransaction> {
  return apiClient.post(`settings/payment-methods/${paymentMethodId}/transactions`, {
    direction: input.direction,
    amount: toMinorUnits(input.amount),
    occurredAt: input.occurredAt,
    counterpartyName: input.counterpartyName || undefined,
    counterpartyPhone: input.counterpartyPhone || undefined,
    note: input.note || undefined,
    image: input.image ? await fileToBase64(input.image) : undefined,
  });
}
