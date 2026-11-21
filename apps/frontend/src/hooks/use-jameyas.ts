import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createJameya,
  CreateJameyaPayload,
  createJameyaPayment,
  createJameyaPayout,
  getJameya,
  JameyaListParams,
  JameyaMoneyEntryPayload,
  JameyaPayment,
  JameyaPaymentPayload,
  listJameyaPayments,
  listJameyas,
  previewJameya,
  updateJameya,
  UpdateJameyaPayload,
} from '@/lib/api/jameyas';

export const jameyaKeys = {
  all: ['jameyas'] as const,
  list: (params: JameyaListParams) => [...jameyaKeys.all, 'list', params] as const,
  detail: (id: string) => [...jameyaKeys.all, 'detail', id] as const,
  payments: (id: string, page: number) => [...jameyaKeys.all, 'payments', id, page] as const,
  memberPayments: (id: string, customerId: string | null) =>
    [...jameyaKeys.all, 'member-payments', id, customerId] as const,
};

const MEMBER_PAYMENTS_PAGE_SIZE = 100;

async function listAllJameyaPayments(id: string): Promise<JameyaPayment[]> {
  const payments: JameyaPayment[] = [];
  for (let page = 1, totalPages = 1; page <= totalPages; page += 1) {
    const result = await listJameyaPayments(id, { page, limit: MEMBER_PAYMENTS_PAGE_SIZE });
    payments.push(...result.data);
    totalPages = result.totalPages;
  }
  return payments;
}

export function useJameyas(params: JameyaListParams, options: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: jameyaKeys.list(params),
    queryFn: () => listJameyas(params),
    placeholderData: (previousData) => previousData,
    enabled: options.enabled,
  });
}

export function useJameya(id: string) {
  return useQuery({
    queryKey: jameyaKeys.detail(id),
    queryFn: () => getJameya(id),
    enabled: Boolean(id),
  });
}

export function useJameyaPayments(id: string, page: number) {
  return useQuery({
    queryKey: jameyaKeys.payments(id, page),
    queryFn: () => listJameyaPayments(id, { page, limit: 10 }),
    placeholderData: (previousData) => previousData,
  });
}

export function useJameyaMemberPayments(id: string, customerId: string | null) {
  return useQuery({
    queryKey: jameyaKeys.memberPayments(id, customerId),
    queryFn: async () => (await listAllJameyaPayments(id)).filter((payment) => payment.customerId === customerId),
    enabled: customerId !== null,
  });
}

export function usePreviewJameya() {
  return useMutation({ mutationFn: (payload: CreateJameyaPayload) => previewJameya(payload) });
}

export function useCreateJameya() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateJameyaPayload) => createJameya(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: jameyaKeys.all }),
  });
}

export function useUpdateJameya(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateJameyaPayload) => updateJameya(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: jameyaKeys.all }),
  });
}

export function useCreateJameyaPayment(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: JameyaPaymentPayload) => createJameyaPayment(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: jameyaKeys.all }),
  });
}

export function useCreateJameyaPayout(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ cycleId, payload }: { cycleId: string; payload: JameyaMoneyEntryPayload }) =>
      createJameyaPayout(id, cycleId, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: jameyaKeys.all }),
  });
}
