import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createPayment, listPayments, PaymentListParams } from '@/lib/api/payments';
import { PaymentInput } from '@/lib/schemas/payment';
import { contractKeys } from './use-contracts';
import { dashboardKeys } from './use-dashboard';

export const paymentKeys = {
  all: ['payments'] as const,
  list: (params: PaymentListParams) => [...paymentKeys.all, 'list', params] as const,
};

export function usePayments(params: PaymentListParams) {
  return useQuery({
    queryKey: paymentKeys.list(params),
    queryFn: () => listPayments(params),
  });
}

export function useCreatePayment(contractId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: PaymentInput) => createPayment(contractId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: paymentKeys.all });
      queryClient.invalidateQueries({ queryKey: contractKeys.detail(contractId) });
      queryClient.invalidateQueries({ queryKey: contractKeys.all });
      queryClient.invalidateQueries({ queryKey: dashboardKeys.all });
    },
  });
}
