import type { NotificationLanguage } from '@/components/shared/notification-language-toggle';
import { apiClient } from './client';
import { buildQuery, PaginatedResult } from './pagination';

export type BroadcastAudience = 'ALL' | 'SELECTED';
export type BroadcastStatus = 'QUEUED' | 'SENDING' | 'DONE';

export interface BroadcastSubscriber {
  id: string;
  name: string;
  telegramNotificationsEnabled: boolean;
  telegramBroadcastsEnabled: boolean;
}

export interface BroadcastCounts {
  pending: number;
  sent: number;
  failed: number;
  total: number;
}

export interface Broadcast {
  id: string;
  body: string;
  hasImage: boolean;
  audience: BroadcastAudience;
  status: BroadcastStatus;
  createdAt: string;
  counts: BroadcastCounts;
}

export interface CreatedBroadcast {
  id: string;
  body: string;
  hasImage: boolean;
  audience: BroadcastAudience;
  status: BroadcastStatus;
  createdAt: string;
  recipientCount: number;
}

export interface CreateBroadcastInput {
  body: string;
  image?: string;
  audience: BroadcastAudience;
  customerIds?: string[];
}

export interface ListParams {
  q?: string;
  page?: number;
  limit?: number;
}

export type { NotificationLanguage };

export function listSubscribers(params: ListParams): Promise<PaginatedResult<BroadcastSubscriber>> {
  return apiClient.get(`announcements/subscribers${buildQuery(params)}`);
}

export function listBroadcasts(params: ListParams): Promise<PaginatedResult<Broadcast>> {
  return apiClient.get(`announcements${buildQuery(params)}`);
}

export function createBroadcast(input: CreateBroadcastInput): Promise<CreatedBroadcast> {
  return apiClient.post('announcements', input);
}
