import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Counterparty,
  CounterpartyHistoryParams,
  CounterpartyListParams,
  createCounterparty,
  createCounterpartyAdjustment,
  deleteCounterparty,
  getCounterparty,
  getCounterpartyHistory,
  listCounterparties,
  updateCounterparty,
} from '@/lib/api/counterparties';
import { CounterpartyAdjustmentInput, CounterpartyInput } from '@/lib/schemas/counterparty';

export const counterpartyKeys = {
  all: ['counterparties'] as const,
  list: (params: CounterpartyListParams) => [...counterpartyKeys.all, 'list', params] as const,
  detail: (id: string) => [...counterpartyKeys.all, 'detail', id] as const,
  history: (id: string, params: CounterpartyHistoryParams) =>
    [...counterpartyKeys.all, 'history', id, params] as const,
};

export function useCounterparties(params: CounterpartyListParams) {
  return useQuery({
    queryKey: counterpartyKeys.list(params),
    queryFn: () => listCounterparties(params),
    placeholderData: (previousData) => previousData,
  });
}

export function useCounterparty(id: string) {
  return useQuery({
    queryKey: counterpartyKeys.detail(id),
    queryFn: () => getCounterparty(id),
    enabled: Boolean(id),
  });
}

export function useCounterpartyHistory(id: string, params: CounterpartyHistoryParams) {
  return useQuery({
    queryKey: counterpartyKeys.history(id, params),
    queryFn: () => getCounterpartyHistory(id, params),
    enabled: Boolean(id),
    placeholderData: (previousData) => previousData,
  });
}

export function useCreateCounterparty() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CounterpartyInput) => createCounterparty(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: counterpartyKeys.all }),
  });
}

export function useUpdateCounterparty(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: Partial<CounterpartyInput>) => updateCounterparty(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: counterpartyKeys.all });
      queryClient.invalidateQueries({ queryKey: counterpartyKeys.detail(id) });
    },
  });
}

export function useDeleteCounterparty() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteCounterparty(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: counterpartyKeys.all }),
  });
}

export function useCreateCounterpartyAdjustment(counterpartyId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CounterpartyAdjustmentInput) => createCounterpartyAdjustment(counterpartyId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: counterpartyKeys.all });
      queryClient.invalidateQueries({ queryKey: counterpartyKeys.detail(counterpartyId) });
    },
  });
}

export type { Counterparty };
