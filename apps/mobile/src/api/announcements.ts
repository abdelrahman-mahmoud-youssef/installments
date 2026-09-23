import { apiClient, buildQuery, PaginatedResult } from './client';

const BYTES_PER_MEGABYTE = 1024 * 1024;
export const ANNOUNCEMENT_IMAGE_MAX_MEGABYTES = 5;
export const ANNOUNCEMENT_IMAGE_MAX_BYTES = ANNOUNCEMENT_IMAGE_MAX_MEGABYTES * BYTES_PER_MEGABYTE;
export const ANNOUNCEMENT_BODY_MAX_LENGTH = 4000;

export type AnnouncementAudience = 'ALL' | 'SELECTED';
export type AnnouncementStatus = 'QUEUED' | 'SENDING' | 'DONE';

export interface AnnouncementCounts {
  pending: number;
  sent: number;
  failed: number;
  total: number;
}

export interface Announcement {
  id: string;
  body: string;
  hasImage: boolean;
  audience: AnnouncementAudience;
  status: AnnouncementStatus;
  createdAt: string;
  counts: AnnouncementCounts;
}

export interface CreatedAnnouncement extends Omit<Announcement, 'counts'> {
  recipientCount: number;
}

export interface AnnouncementSubscriber {
  id: string;
  name: string;
  telegramNotificationsEnabled: boolean;
  telegramBroadcastsEnabled: boolean;
}

export interface AnnouncementListParams {
  page?: number;
  limit?: number;
}

export interface SubscriberListParams {
  q?: string;
  page?: number;
  limit?: number;
}

export interface CreateAnnouncementInput {
  body: string;
  image?: string;
  audience: AnnouncementAudience;
  customerIds?: string[];
}

export function listAnnouncements(params: AnnouncementListParams): Promise<PaginatedResult<Announcement>> {
  return apiClient.get(`announcements${buildQuery({ ...params })}`);
}

export function listAnnouncementSubscribers(
  params: SubscriberListParams,
): Promise<PaginatedResult<AnnouncementSubscriber>> {
  return apiClient.get(`announcements/subscribers${buildQuery({ ...params })}`);
}

export function createAnnouncement(input: CreateAnnouncementInput): Promise<CreatedAnnouncement> {
  return apiClient.post('announcements', input);
}
