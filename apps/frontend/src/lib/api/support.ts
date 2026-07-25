import { SupportMessageInput } from '@/lib/schemas/support';
import { apiClient } from './client';

export function submitSupportMessage(input: SupportMessageInput): Promise<void> {
  return apiClient.post('support', input);
}
