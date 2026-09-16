import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { listAuditLogs } from '@/api/audit';
import { PaginatedResult } from '@/api/client';
import {
  ContractListParams,
  getContract,
  listContracts,
} from '@/api/contracts';
import { CustomerListParams, getCustomer, listCustomers } from '@/api/customers';
import { getDashboard } from '@/api/dashboard';
import {
  CreatePaymentMethodInput,
  createPaymentMethod,
  deletePaymentMethod,
  listPaymentMethods,
  UpdatePaymentMethodInput,
  updatePaymentMethod,
} from '@/api/payment-methods';
import { CreatePaymentInput, createPayment } from '@/api/payments';
import { CreateStaffInput, createStaff, listStaff, setStaffActive } from '@/api/staff';

const PAGE_SIZE = 20;

function nextPageParam<T>(lastPage: PaginatedResult<T>): number | undefined {
  return lastPage.page < lastPage.totalPages ? lastPage.page + 1 : undefined;
}

export const queryKeys = {
  dashboard: ['dashboard'] as const,
  customers: (params: CustomerListParams) => ['customers', params] as const,
  customer: (id: string) => ['customers', 'detail', id] as const,
  contracts: (params: ContractListParams) => ['contracts', params] as const,
  contract: (id: string) => ['contracts', 'detail', id] as const,
  paymentMethods: ['payment-methods'] as const,
  staff: ['staff'] as const,
  auditLogs: ['audit-logs'] as const,
};

export function useDashboard() {
  return useQuery({ queryKey: queryKeys.dashboard, queryFn: getDashboard });
}

export function useCustomers(params: Omit<CustomerListParams, 'page' | 'limit'>) {
  return useInfiniteQuery({
    queryKey: queryKeys.customers(params),
    queryFn: ({ pageParam }) => listCustomers({ ...params, page: pageParam, limit: PAGE_SIZE }),
    initialPageParam: 1,
    getNextPageParam: nextPageParam,
  });
}

export function useCustomer(id: string) {
  return useQuery({ queryKey: queryKeys.customer(id), queryFn: () => getCustomer(id) });
}

export function useContracts(params: Omit<ContractListParams, 'page' | 'limit'>) {
  return useInfiniteQuery({
    queryKey: queryKeys.contracts(params),
    queryFn: ({ pageParam }) => listContracts({ ...params, page: pageParam, limit: PAGE_SIZE }),
    initialPageParam: 1,
    getNextPageParam: nextPageParam,
  });
}

export function useContract(id: string) {
  return useQuery({ queryKey: queryKeys.contract(id), queryFn: () => getContract(id) });
}

export function useRecordPayment(contractId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreatePaymentInput) => createPayment(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.contract(contractId) });
      void queryClient.invalidateQueries({ queryKey: ['contracts'] });
      void queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
      void queryClient.invalidateQueries({ queryKey: queryKeys.paymentMethods });
    },
  });
}

export function usePaymentMethods() {
  return useQuery({ queryKey: queryKeys.paymentMethods, queryFn: listPaymentMethods });
}

export function useCreatePaymentMethod() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreatePaymentMethodInput) => createPaymentMethod(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.paymentMethods }),
  });
}

export function useUpdatePaymentMethod() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdatePaymentMethodInput }) =>
      updatePaymentMethod(id, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.paymentMethods }),
  });
}

export function useDeletePaymentMethod() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deletePaymentMethod(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.paymentMethods }),
  });
}

export function useStaff() {
  return useQuery({ queryKey: queryKeys.staff, queryFn: listStaff });
}

export function useCreateStaff() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateStaffInput) => createStaff(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.staff }),
  });
}

export function useSetStaffActive() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) => setStaffActive(id, isActive),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.staff }),
  });
}

export function useAuditLogs() {
  return useInfiniteQuery({
    queryKey: queryKeys.auditLogs,
    queryFn: ({ pageParam }) => listAuditLogs({ page: pageParam, limit: PAGE_SIZE }),
    initialPageParam: 1,
    getNextPageParam: nextPageParam,
  });
}
