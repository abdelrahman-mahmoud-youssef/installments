import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getMySupportMessages, markSupportRepliesSeen, submitSupportMessage } from '@/lib/api/support';
import { SupportMessageInput } from '@/lib/schemas/support';

export const supportKeys = {
  mine: ['support', 'mine'] as const,
};

export function useSupportMessages(options?: { refetchInterval?: number }) {
  return useQuery({
    queryKey: supportKeys.mine,
    queryFn: getMySupportMessages,
    placeholderData: (previousData) => previousData,
    ...options,
  });
}

export function useSubmitSupportMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: SupportMessageInput) => submitSupportMessage(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: supportKeys.mine }),
  });
}

export function useMarkSupportRepliesSeen() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => markSupportRepliesSeen(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: supportKeys.mine }),
  });
}
