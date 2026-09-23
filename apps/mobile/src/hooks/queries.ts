import {
  keepPreviousData,
  QueryClient,
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { listAuditLogs } from '@/api/audit';
import { getBranding, removeLogo, UpdateBrandingInput, updateBranding, uploadLogo } from '@/api/branding';
import { PaginatedResult } from '@/api/client';
import {
  CounterpartyHistoryParams,
  CounterpartyListParams,
  CreateCounterpartyAdjustmentInput,
  createCounterparty,
  createCounterpartyAdjustment,
  deleteCounterparty,
  getCounterparty,
  getCounterpartyHistory,
  listCounterparties,
  SaveCounterpartyInput,
  updateCounterparty,
} from '@/api/counterparties';
import {
  createOffer,
  deleteOffer,
  listOffers,
  OfferListParams,
  SaveOfferInput,
  setOffersVisibility,
  updateOffer,
} from '@/api/offers';
import {
  cancelContract,
  ContractListParams,
  createContract,
  CreateContractInput,
  getContract,
  listContracts,
  listContractTags,
  updateContractTag,
} from '@/api/contracts';
import {
  createCustomer,
  CustomerListParams,
  deleteCustomer,
  getCustomer,
  listCustomerNotifications,
  listCustomers,
  SaveCustomerInput,
  updateCustomer,
} from '@/api/customers';
import { getDashboard } from '@/api/dashboard';
import {
  CreatePaymentMethodInput,
  createPaymentMethod,
  deletePaymentMethod,
  listPaymentMethods,
  UpdatePaymentMethodInput,
  updatePaymentMethod,
} from '@/api/payment-methods';
import {
  CreatePaymentMethodTransactionInput,
  createPaymentMethodTransaction,
  getPaymentMethodMonthlySummary,
  listPaymentMethodTransactions,
  PaymentMethodTransactionListParams,
} from '@/api/payment-method-transactions';
import {
  ApprovePaymentClaimInput,
  approvePaymentClaim,
  DeclinePaymentClaimInput,
  declinePaymentClaim,
  listPaymentClaims,
  PaymentClaimListParams,
} from '@/api/payment-claims';
import { CreatePaymentInput, createPayment } from '@/api/payments';
import { createShareLink } from '@/api/share-links';
import { getReports } from '@/api/reports';
import { CreateStaffInput, createStaff, listStaff, setStaffActive } from '@/api/staff';
import {
  CreateSupportMessageInput,
  createSupportMessage,
  listSupportMessages,
  markSupportRepliesSeen,
} from '@/api/support';

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
  contractsRoot: ['contracts'] as const,
  contractTags: ['contracts', 'tags'] as const,
  customersRoot: ['customers'] as const,
  customerNotifications: (id: string) => ['customers', 'notifications', id] as const,
  paymentMethods: ['payment-methods'] as const,
  staff: ['staff'] as const,
  auditLogs: ['audit-logs'] as const,
  offers: (params: OfferListParams) => ['offers', params] as const,
  branding: ['branding'] as const,
  paymentMethodTransactionsRoot: ['payment-method-transactions'] as const,
  paymentMethodTransactions: (paymentMethodId: string, params: PaymentMethodTransactionListParams) =>
    ['payment-method-transactions', paymentMethodId, 'list', params] as const,
  paymentMethodSummary: (paymentMethodId: string, month: string) =>
    ['payment-method-transactions', paymentMethodId, 'summary', month] as const,
  counterpartiesRoot: ['counterparties'] as const,
  counterparties: (params: CounterpartyListParams) => ['counterparties', 'list', params] as const,
  counterparty: (id: string) => ['counterparties', 'detail', id] as const,
  counterpartyHistory: (id: string, params: CounterpartyHistoryParams) =>
    ['counterparties', 'history', id, params] as const,
  paymentClaimsRoot: ['payment-claims'] as const,
  paymentClaims: (params: PaymentClaimListParams) => ['payment-claims', 'list', params] as const,
  reportsRoot: ['reports'] as const,
  reports: (month: string) => ['reports', month] as const,
  supportMessages: ['support'] as const,
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

export function useContractTags(enabled: boolean) {
  return useQuery({ queryKey: queryKeys.contractTags, queryFn: listContractTags, enabled });
}

export function useCreateContract() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateContractInput) => createContract(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.contractsRoot });
      void queryClient.invalidateQueries({ queryKey: queryKeys.customersRoot });
      void queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
    },
  });
}

export function useCancelContract(contractId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => cancelContract(contractId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.contractsRoot });
      void queryClient.invalidateQueries({ queryKey: queryKeys.customersRoot });
      void queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
    },
  });
}

export function useUpdateContractTag(contractId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (tag: string) => updateContractTag(contractId, tag),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.contractsRoot }),
  });
}

export function useCreateCustomer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: SaveCustomerInput) => createCustomer(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.customersRoot });
      void queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
    },
  });
}

export function useUpdateCustomer(customerId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: SaveCustomerInput) => updateCustomer(customerId, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.customersRoot });
      void queryClient.invalidateQueries({ queryKey: queryKeys.contractsRoot });
    },
  });
}

export function useDeleteCustomer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (customerId: string) => deleteCustomer(customerId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.customersRoot });
      void queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
    },
  });
}

export function useCustomerNotifications(customerId: string, enabled: boolean) {
  return useInfiniteQuery({
    queryKey: queryKeys.customerNotifications(customerId),
    queryFn: ({ pageParam }) => listCustomerNotifications(customerId, { page: pageParam, limit: PAGE_SIZE }),
    initialPageParam: 1,
    getNextPageParam: nextPageParam,
    enabled,
  });
}

export function useCreateShareLink() {
  return useMutation({ mutationFn: (targetPath: string) => createShareLink(targetPath) });
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
      void queryClient.invalidateQueries({ queryKey: queryKeys.reportsRoot });
    },
  });
}

export function usePaymentMethods(enabled = true) {
  return useQuery({ queryKey: queryKeys.paymentMethods, queryFn: listPaymentMethods, enabled });
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

export function useOffers(params: Omit<OfferListParams, 'page' | 'limit'>, enabled = true) {
  return useInfiniteQuery({
    queryKey: queryKeys.offers(params),
    queryFn: ({ pageParam }) => listOffers({ ...params, page: pageParam, limit: PAGE_SIZE }),
    initialPageParam: 1,
    getNextPageParam: nextPageParam,
    enabled,
  });
}

export function useCreateOffer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: SaveOfferInput) => createOffer(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['offers'] }),
  });
}

export function useUpdateOffer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<SaveOfferInput> }) => updateOffer(id, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['offers'] }),
  });
}

export function useDeleteOffer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteOffer(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['offers'] }),
  });
}

export function useSetOffersVisibility() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (showOffersOnPublicPage: boolean) => setOffersVisibility(showOffersOnPublicPage),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.branding }),
  });
}

export function useBranding(enabled = true) {
  return useQuery({ queryKey: queryKeys.branding, queryFn: getBranding, enabled });
}

export function useUpdateBranding() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateBrandingInput) => updateBranding(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.branding }),
  });
}

export function useUploadLogo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (image: string) => uploadLogo(image),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.branding }),
  });
}

export function useRemoveLogo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => removeLogo(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.branding }),
  });
}

export function usePaymentMethodTransactions(
  paymentMethodId: string,
  params: Omit<PaymentMethodTransactionListParams, 'page' | 'limit'>,
  enabled = true,
) {
  return useInfiniteQuery({
    queryKey: queryKeys.paymentMethodTransactions(paymentMethodId, params),
    queryFn: ({ pageParam }) =>
      listPaymentMethodTransactions(paymentMethodId, { ...params, page: pageParam, limit: PAGE_SIZE }),
    initialPageParam: 1,
    getNextPageParam: nextPageParam,
    enabled,
  });
}

export function usePaymentMethodMonthlySummary(paymentMethodId: string, month: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.paymentMethodSummary(paymentMethodId, month),
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
      input: CreatePaymentMethodTransactionInput;
    }) => createPaymentMethodTransaction(paymentMethodId, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.paymentMethodTransactionsRoot });
      void queryClient.invalidateQueries({ queryKey: queryKeys.paymentMethods });
      void queryClient.invalidateQueries({ queryKey: queryKeys.counterpartiesRoot });
    },
  });
}

export function useCounterparties(params: Omit<CounterpartyListParams, 'page' | 'limit'>, enabled = true) {
  return useInfiniteQuery({
    queryKey: queryKeys.counterparties(params),
    queryFn: ({ pageParam }) => listCounterparties({ ...params, page: pageParam, limit: PAGE_SIZE }),
    initialPageParam: 1,
    getNextPageParam: nextPageParam,
    enabled,
  });
}

export function useCounterparty(id: string, enabled = true) {
  return useQuery({ queryKey: queryKeys.counterparty(id), queryFn: () => getCounterparty(id), enabled });
}

export function useCounterpartyHistory(
  id: string,
  params: Omit<CounterpartyHistoryParams, 'page' | 'limit'>,
  enabled = true,
) {
  return useInfiniteQuery({
    queryKey: queryKeys.counterpartyHistory(id, params),
    queryFn: ({ pageParam }) => getCounterpartyHistory(id, { ...params, page: pageParam, limit: PAGE_SIZE }),
    initialPageParam: 1,
    getNextPageParam: nextPageParam,
    enabled,
  });
}

export function useCreateCounterparty() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: SaveCounterpartyInput) => createCounterparty(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.counterpartiesRoot }),
  });
}

export function useUpdateCounterparty() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: SaveCounterpartyInput }) => updateCounterparty(id, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.counterpartiesRoot }),
  });
}

export function useDeleteCounterparty() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteCounterparty(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.counterpartiesRoot }),
  });
}

export function useCreateCounterpartyAdjustment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: CreateCounterpartyAdjustmentInput }) =>
      createCounterpartyAdjustment(id, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.counterpartiesRoot }),
  });
}

export function usePaymentClaims(params: Omit<PaymentClaimListParams, 'page' | 'limit'>) {
  return useInfiniteQuery({
    queryKey: queryKeys.paymentClaims(params),
    queryFn: ({ pageParam }) => listPaymentClaims({ ...params, page: pageParam, limit: PAGE_SIZE }),
    initialPageParam: 1,
    getNextPageParam: nextPageParam,
  });
}

function invalidateAfterClaimReview(queryClient: QueryClient): void {
  void queryClient.invalidateQueries({ queryKey: queryKeys.paymentClaimsRoot });
  void queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
  void queryClient.invalidateQueries({ queryKey: ['contracts'] });
  void queryClient.invalidateQueries({ queryKey: queryKeys.paymentMethods });
  void queryClient.invalidateQueries({ queryKey: queryKeys.paymentMethodTransactionsRoot });
  void queryClient.invalidateQueries({ queryKey: queryKeys.reportsRoot });
}

export function useApprovePaymentClaim() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: ApprovePaymentClaimInput }) => approvePaymentClaim(id, input),
    onSettled: () => invalidateAfterClaimReview(queryClient),
  });
}

export function useDeclinePaymentClaim() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: DeclinePaymentClaimInput }) => declinePaymentClaim(id, input),
    onSettled: () => invalidateAfterClaimReview(queryClient),
  });
}

export function useReports(month: string) {
  return useQuery({
    queryKey: queryKeys.reports(month),
    queryFn: () => getReports(month),
    placeholderData: keepPreviousData,
  });
}

export function useSupportMessages() {
  return useQuery({ queryKey: queryKeys.supportMessages, queryFn: listSupportMessages });
}

export function useCreateSupportMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateSupportMessageInput) => createSupportMessage(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.supportMessages }),
  });
}

export function useMarkSupportRepliesSeen() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => markSupportRepliesSeen(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.supportMessages }),
  });
}
