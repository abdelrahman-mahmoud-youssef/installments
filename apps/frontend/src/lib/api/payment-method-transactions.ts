import { toMinorUnits } from '@/lib/format';
import { PaymentMethodTransactionInput } from '@/lib/schemas/payment-method-transaction';
import { apiClient } from './client';
import { buildQuery, PaginatedResult } from './pagination';

export interface PaymentMethodTransaction {
  id: string;
  direction: 'IN' | 'OUT';
  amount: number;
  note: string | null;
  occurredAt: string;
  createdAt: string;
}

export interface PaymentMethodTransactionListParams {
  page?: number;
  limit?: number;
}

export function listPaymentMethodTransactions(
  paymentMethodId: string,
  params: PaymentMethodTransactionListParams,
): Promise<PaginatedResult<PaymentMethodTransaction>> {
  return apiClient.get(`settings/payment-methods/${paymentMethodId}/transactions${buildQuery(params)}`);
}

export function createPaymentMethodTransaction(
  paymentMethodId: string,
  input: PaymentMethodTransactionInput,
): Promise<PaymentMethodTransaction> {
  return apiClient.post(`settings/payment-methods/${paymentMethodId}/transactions`, {
    direction: input.direction,
    amount: toMinorUnits(input.amount),
    occurredAt: input.occurredAt,
    note: input.note || undefined,
  });
}
