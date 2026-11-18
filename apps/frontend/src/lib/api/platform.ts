import { SubscriptionStatus } from '@/lib/enums';
import { routes } from '@/lib/routes';
import { LoginInput } from '@/lib/schemas/auth';
import { createApiClient, postJson } from './client';
import { buildQuery, PaginatedResult } from './pagination';

const platformApiClient = createApiClient({ basePath: '/api/platform', loginPath: routes.platformLogin });

export interface PlatformTenant {
  id: string;
  name: string;
  slug: string;
  phone: string | null;
  createdAt: string;
  subscriptionExpiresOn: string;
  subscriptionStatus: SubscriptionStatus;
  owner: { name: string; email: string } | null;
  referredBy: { name: string; slug: string } | null;
  invitedShopsCount: number;
  jameyaEnabled: boolean;
}

export type SubscriptionPricing = 'STANDARD' | 'REFERRAL';

export interface PlatformTenantSubscription {
  id: string;
  periodStart: string;
  periodEnd: string;
  amount: number;
  createdAt: string;
  activatedBy: { name: string } | null;
}

export const SUPPORT_REPLY_STATES = ['AWAITING_REPLY', 'REPLIED'] as const;

export type SupportReplyState = (typeof SUPPORT_REPLY_STATES)[number];

export interface PlatformSupportMessage {
  id: string;
  subject: string;
  message: string;
  imageUrl: string | null;
  adminReply: string | null;
  repliedAt: string | null;
  createdAt: string;
  sender: { name: string; email: string };
  tenant: { id: string; name: string; slug: string };
}

export interface PlatformSupportQuery {
  state?: SupportReplyState;
  page: number;
  limit: number;
}

export interface PlatformTenantQuery {
  q?: string;
  status?: SubscriptionStatus;
  page: number;
  limit: number;
}

export interface PlatformTenantSubscriptionQuery {
  page: number;
  limit: number;
}

export function platformLogin(input: LoginInput): Promise<{ success: true }> {
  return postJson('/api/platform-auth/login', input);
}

export async function platformLogout(): Promise<void> {
  await fetch('/api/platform-auth/logout', { method: 'POST' });
}

export function listPlatformTenants(query: PlatformTenantQuery): Promise<PaginatedResult<PlatformTenant>> {
  return platformApiClient.get(`tenants${buildQuery(query)}`);
}

export function activatePlatformTenant(tenantId: string, pricing: SubscriptionPricing): Promise<PlatformTenant> {
  return platformApiClient.post(`tenants/${tenantId}/activate`, { pricing });
}

export function deactivatePlatformTenant(tenantId: string): Promise<PlatformTenant> {
  return platformApiClient.post(`tenants/${tenantId}/deactivate`);
}

export function updatePlatformTenantFeatures(tenantId: string, jameyaEnabled: boolean): Promise<PlatformTenant> {
  return platformApiClient.patch(`tenants/${tenantId}/features`, { jameyaEnabled });
}

export function listPlatformTenantSubscriptions(
  tenantId: string,
  query: PlatformTenantSubscriptionQuery,
): Promise<PaginatedResult<PlatformTenantSubscription>> {
  return platformApiClient.get(`tenants/${tenantId}/subscriptions${buildQuery(query)}`);
}

export function listPlatformSupportMessages(
  query: PlatformSupportQuery,
): Promise<PaginatedResult<PlatformSupportMessage>> {
  return platformApiClient.get(`support${buildQuery(query)}`);
}

export function countPlatformSupportAwaitingReply(): Promise<{ count: number }> {
  return platformApiClient.get('support/awaiting-reply-count');
}

export function replyToPlatformSupportMessage(messageId: string, reply: string): Promise<PlatformSupportMessage> {
  return platformApiClient.post(`support/${messageId}/reply`, { reply });
}

export const PUSH_AUDIENCES = ['ALL', 'EXPIRING_SOON', 'EXPIRED', 'SHOP'] as const;

export type PushAudience = (typeof PUSH_AUDIENCES)[number];

export interface PlatformPushAnnouncement {
  id: string;
  title: string;
  body: string;
  audience: PushAudience | null;
  recipientCount: number;
  createdAt: string;
  shopName: string | null;
}

export interface SendPlatformPushInput {
  title: string;
  body: string;
  audience: PushAudience;
  tenantId?: string;
}

export interface PlatformPushQuery {
  page: number;
  limit: number;
}

export function listPlatformPushAnnouncements(
  query: PlatformPushQuery,
): Promise<PaginatedResult<PlatformPushAnnouncement>> {
  return platformApiClient.get(`push${buildQuery(query)}`);
}

export function sendPlatformPushAnnouncement(input: SendPlatformPushInput): Promise<PlatformPushAnnouncement> {
  return platformApiClient.post('push', input);
}
