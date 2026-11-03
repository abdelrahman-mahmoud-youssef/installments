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
