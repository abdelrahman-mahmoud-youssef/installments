import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  listPlatformPushAnnouncements,
  PlatformPushAnnouncement,
  PlatformPushQuery,
  sendPlatformPushAnnouncement,
} from '@/lib/api/platform';

export const platformPushKeys = {
  all: ['platform', 'push'] as const,
  list: (query: PlatformPushQuery) => [...platformPushKeys.all, 'list', query] as const,
};

export function usePlatformPushAnnouncements(query: PlatformPushQuery) {
  return useQuery({
    queryKey: platformPushKeys.list(query),
    queryFn: () => listPlatformPushAnnouncements(query),
    placeholderData: keepPreviousData,
  });
}

export function useSendPlatformPush() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: sendPlatformPushAnnouncement,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: platformPushKeys.all }),
  });
}

export type { PlatformPushAnnouncement };
