import { useMutation } from '@tanstack/react-query';
import { submitSupportMessage } from '@/lib/api/support';
import { SupportMessageInput } from '@/lib/schemas/support';

export function useSubmitSupportMessage() {
  return useMutation({
    mutationFn: (input: SupportMessageInput) => submitSupportMessage(input),
  });
}
