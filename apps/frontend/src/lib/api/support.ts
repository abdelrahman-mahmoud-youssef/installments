import { SupportMessageInput } from '@/lib/schemas/support';
import { apiClient } from './client';

export interface SupportMessage {
  id: string;
  subject: string;
  message: string;
  adminReply: string | null;
  repliedAt: string | null;
  seenAt: string | null;
  createdAt: string;
}

export function getMySupportMessages(): Promise<SupportMessage[]> {
  return apiClient.get('support');
}

export function submitSupportMessage(input: SupportMessageInput): Promise<void> {
  return apiClient.post('support', input);
}

export function markSupportRepliesSeen(): Promise<void> {
  return apiClient.post('support/mark-seen');
}
