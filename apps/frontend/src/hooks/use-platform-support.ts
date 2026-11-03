import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  countPlatformSupportAwaitingReply,
  listPlatformSupportMessages,
  PlatformSupportMessage,
  PlatformSupportQuery,
  replyToPlatformSupportMessage,
} from '@/lib/api/platform';

const AWAITING_REPLY_REFRESH_MS = 60_000;

export const platformSupportKeys = {
  all: ['platform', 'support'] as const,
  list: (query: PlatformSupportQuery) => [...platformSupportKeys.all, 'list', query] as const,
  awaitingReplyCount: () => [...platformSupportKeys.all, 'awaiting-reply-count'] as const,
};

export function usePlatformSupportMessages(query: PlatformSupportQuery) {
  return useQuery({
    queryKey: platformSupportKeys.list(query),
    queryFn: () => listPlatformSupportMessages(query),
    placeholderData: keepPreviousData,
  });
}

export function usePlatformSupportAwaitingReplyCount() {
  return useQuery({
    queryKey: platformSupportKeys.awaitingReplyCount(),
    queryFn: countPlatformSupportAwaitingReply,
    refetchInterval: AWAITING_REPLY_REFRESH_MS,
  });
}

export function useReplyToPlatformSupportMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ messageId, reply }: { messageId: string; reply: string }) =>
      replyToPlatformSupportMessage(messageId, reply),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: platformSupportKeys.all }),
  });
}

export type { PlatformSupportMessage };
