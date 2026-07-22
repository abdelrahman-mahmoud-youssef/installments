import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createCustomer,
  Customer,
  CustomerListParams,
  CustomerNotificationParams,
  deleteCustomer,
  getCustomer,
  getCustomerNotifications,
  listCustomers,
  updateCustomer,
} from '@/lib/api/customers';
import { CustomerInput } from '@/lib/schemas/customer';

export const customerKeys = {
  all: ['customers'] as const,
  list: (params: CustomerListParams) => [...customerKeys.all, 'list', params] as const,
  detail: (id: string) => [...customerKeys.all, 'detail', id] as const,
  notifications: (id: string, params: CustomerNotificationParams) =>
    [...customerKeys.all, 'notifications', id, params] as const,
};

export function useCustomers(params: CustomerListParams) {
  return useQuery({
    queryKey: customerKeys.list(params),
    queryFn: () => listCustomers(params),
    placeholderData: (previousData) => previousData,
  });
}

export function useCustomer(id: string) {
  return useQuery({
    queryKey: customerKeys.detail(id),
    queryFn: () => getCustomer(id),
    enabled: Boolean(id),
  });
}

export function useCreateCustomer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CustomerInput) => createCustomer(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: customerKeys.all }),
  });
}

export function useUpdateCustomer(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: Partial<CustomerInput>) => updateCustomer(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: customerKeys.all });
      queryClient.invalidateQueries({ queryKey: customerKeys.detail(id) });
    },
  });
}

export function useCustomerNotifications(id: string, params: CustomerNotificationParams, enabled: boolean) {
  return useQuery({
    queryKey: customerKeys.notifications(id, params),
    queryFn: () => getCustomerNotifications(id, params),
    enabled: enabled && Boolean(id),
    placeholderData: (previousData) => previousData,
  });
}

export function useDeleteCustomer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteCustomer(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: customerKeys.all }),
  });
}

export type { Customer };
