import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  approvePaymentClaim,
  declinePaymentClaim,
  listPaymentClaims,
  PaymentClaimQueryParams,
} from '@/lib/api/payment-claims';

export const paymentClaimKeys = {
  all: ['payment-claims'] as const,
  list: (params: PaymentClaimQueryParams) => [...paymentClaimKeys.all, 'list', params] as const,
};

export function usePaymentClaims(params: PaymentClaimQueryParams, options?: { refetchInterval?: number }) {
  return useQuery({
    queryKey: paymentClaimKeys.list(params),
    queryFn: () => listPaymentClaims(params),
    placeholderData: (previousData) => previousData,
    ...options,
  });
}

export function useApprovePaymentClaim() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, amount }: { id: string; amount?: number }) => approvePaymentClaim(id, amount),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: paymentClaimKeys.all }),
  });
}

export function useDeclinePaymentClaim() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) => declinePaymentClaim(id, reason),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: paymentClaimKeys.all }),
  });
}
