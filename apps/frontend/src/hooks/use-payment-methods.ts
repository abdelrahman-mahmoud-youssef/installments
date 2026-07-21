import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createPaymentMethod,
  CreatePaymentMethodInput,
  deletePaymentMethod,
  listPaymentMethods,
  PaymentMethod,
  updatePaymentMethod,
  UpdatePaymentMethodInput,
} from '@/lib/api/payment-methods';

export const paymentMethodKeys = {
  all: ['payment-methods'] as const,
};

export function usePaymentMethods() {
  return useQuery({ queryKey: paymentMethodKeys.all, queryFn: listPaymentMethods });
}

export function useCreatePaymentMethod() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreatePaymentMethodInput) => createPaymentMethod(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: paymentMethodKeys.all }),
  });
}

export function useUpdatePaymentMethod() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdatePaymentMethodInput }) =>
      updatePaymentMethod(id, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: paymentMethodKeys.all }),
  });
}

export function useDeletePaymentMethod() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deletePaymentMethod(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: paymentMethodKeys.all }),
  });
}

export type { PaymentMethod };
