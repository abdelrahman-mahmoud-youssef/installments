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
}

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

export function activatePlatformTenant(tenantId: string): Promise<PlatformTenant> {
  return platformApiClient.post(`tenants/${tenantId}/activate`);
}

export function deactivatePlatformTenant(tenantId: string): Promise<PlatformTenant> {
  return platformApiClient.post(`tenants/${tenantId}/deactivate`);
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
