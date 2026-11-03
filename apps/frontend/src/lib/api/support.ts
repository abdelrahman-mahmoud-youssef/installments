import { fileToBase64 } from '@/lib/file';
import { SupportMessageInput } from '@/lib/schemas/support';
import { apiClient } from './client';

export interface SupportMessage {
  id: string;
  subject: string;
  message: string;
  imageUrl: string | null;
  adminReply: string | null;
  repliedAt: string | null;
  seenAt: string | null;
  createdAt: string;
}

export function getMySupportMessages(): Promise<SupportMessage[]> {
  return apiClient.get('support');
}

export async function submitSupportMessage(input: SupportMessageInput): Promise<void> {
  const { image, ...rest } = input;
  return apiClient.post('support', { ...rest, image: image ? await fileToBase64(image) : undefined });
}

export function markSupportRepliesSeen(): Promise<void> {
  return apiClient.post('support/mark-seen');
}
