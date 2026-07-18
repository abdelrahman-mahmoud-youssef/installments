import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Broadcast,
  createBroadcast,
  CreateBroadcastInput,
  listBroadcasts,
  listSubscribers,
  ListParams,
} from '@/lib/api/announcements';

export const announcementKeys = {
  all: ['announcements'] as const,
  subscribers: (params: ListParams) => [...announcementKeys.all, 'subscribers', params] as const,
  history: (params: ListParams) => [...announcementKeys.all, 'history', params] as const,
};

export function useSubscribers(params: ListParams) {
  return useQuery({
    queryKey: announcementKeys.subscribers(params),
    queryFn: () => listSubscribers(params),
    placeholderData: (previousData) => previousData,
  });
}

export function useBroadcasts(params: ListParams) {
  return useQuery({
    queryKey: announcementKeys.history(params),
    queryFn: () => listBroadcasts(params),
    placeholderData: (previousData) => previousData,
  });
}

export function useCreateBroadcast() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateBroadcastInput) => createBroadcast(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: announcementKeys.all }),
  });
}

export type { Broadcast };
