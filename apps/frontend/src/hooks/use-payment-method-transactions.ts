import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createPaymentMethodTransaction,
  getPaymentMethodMonthlySummary,
  listPaymentMethodTransactions,
  PaymentMethodTransactionListParams,
} from '@/lib/api/payment-method-transactions';
import { PaymentMethodTransactionInput } from '@/lib/schemas/payment-method-transaction';
import { counterpartyKeys } from './use-counterparties';
import { paymentMethodKeys } from './use-payment-methods';

export const paymentMethodTransactionKeys = {
  all: ['payment-method-transactions'] as const,
  list: (paymentMethodId: string, params: PaymentMethodTransactionListParams) =>
    [...paymentMethodTransactionKeys.all, paymentMethodId, params] as const,
  summary: (paymentMethodId: string, month?: string) =>
    [...paymentMethodTransactionKeys.all, paymentMethodId, 'summary', month] as const,
};

export function usePaymentMethodTransactions(
  paymentMethodId: string,
  params: PaymentMethodTransactionListParams,
  enabled = true,
) {
  return useQuery({
    queryKey: paymentMethodTransactionKeys.list(paymentMethodId, params),
    queryFn: () => listPaymentMethodTransactions(paymentMethodId, params),
    enabled,
  });
}

export function usePaymentMethodMonthlySummary(paymentMethodId: string, month?: string, enabled = true) {
  return useQuery({
    queryKey: paymentMethodTransactionKeys.summary(paymentMethodId, month),
    queryFn: () => getPaymentMethodMonthlySummary(paymentMethodId, month),
    enabled,
  });
}

export function useCreatePaymentMethodTransaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      paymentMethodId,
      input,
    }: {
      paymentMethodId: string;
      input: PaymentMethodTransactionInput;
    }) => createPaymentMethodTransaction(paymentMethodId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: paymentMethodTransactionKeys.all });
      queryClient.invalidateQueries({ queryKey: paymentMethodKeys.all });
      queryClient.invalidateQueries({ queryKey: counterpartyKeys.all });
    },
  });
}
