import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createPaymentMethodTransaction,
  getPaymentMethodMonthlySummary,
  listPaymentMethodTransactions,
  PaymentMethodTransactionListParams,
} from '@/lib/api/payment-method-transactions';
import { PaymentMethodTransactionInput } from '@/lib/schemas/payment-method-transaction';
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
) {
  return useQuery({
    queryKey: paymentMethodTransactionKeys.list(paymentMethodId, params),
    queryFn: () => listPaymentMethodTransactions(paymentMethodId, params),
  });
}

export function usePaymentMethodMonthlySummary(paymentMethodId: string, month?: string) {
  return useQuery({
    queryKey: paymentMethodTransactionKeys.summary(paymentMethodId, month),
    queryFn: () => getPaymentMethodMonthlySummary(paymentMethodId, month),
  });
}

export function useCreatePaymentMethodTransaction(paymentMethodId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: PaymentMethodTransactionInput) =>
      createPaymentMethodTransaction(paymentMethodId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: paymentMethodTransactionKeys.all });
      queryClient.invalidateQueries({ queryKey: paymentMethodKeys.all });
    },
  });
}
