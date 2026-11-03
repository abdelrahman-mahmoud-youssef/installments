import { apiClient } from './client';

export const SUPPORT_SUBJECT_MAX_LENGTH = 150;
export const SUPPORT_MESSAGE_MAX_LENGTH = 2000;
const BYTES_PER_MEGABYTE = 1024 * 1024;
export const SUPPORT_IMAGE_MAX_MEGABYTES = 4;
export const SUPPORT_IMAGE_MAX_BYTES = SUPPORT_IMAGE_MAX_MEGABYTES * BYTES_PER_MEGABYTE;

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

export interface CreateSupportMessageInput {
  subject: string;
  message: string;
  image?: string;
}

export function listSupportMessages(): Promise<SupportMessage[]> {
  return apiClient.get('support');
}

export function createSupportMessage(input: CreateSupportMessageInput): Promise<SupportMessage> {
  return apiClient.post('support', input);
}

export function markSupportRepliesSeen(): Promise<void> {
  return apiClient.post('support/mark-seen');
}
