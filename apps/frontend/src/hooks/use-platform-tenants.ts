import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  activatePlatformTenant,
  deactivatePlatformTenant,
  listPlatformTenants,
  listPlatformTenantSubscriptions,
  PlatformTenant,
  PlatformTenantQuery,
  PlatformTenantSubscription,
  PlatformTenantSubscriptionQuery,
} from '@/lib/api/platform';

export const platformTenantKeys = {
  all: ['platform', 'tenants'] as const,
  list: (query: PlatformTenantQuery) => [...platformTenantKeys.all, 'list', query] as const,
  subscriptions: (tenantId: string, query: PlatformTenantSubscriptionQuery) =>
    [...platformTenantKeys.all, 'subscriptions', tenantId, query] as const,
};

export function usePlatformTenants(query: PlatformTenantQuery) {
  return useQuery({
    queryKey: platformTenantKeys.list(query),
    queryFn: () => listPlatformTenants(query),
    placeholderData: keepPreviousData,
  });
}

export function usePlatformTenantSubscriptions(tenantId: string, query: PlatformTenantSubscriptionQuery) {
  return useQuery({
    queryKey: platformTenantKeys.subscriptions(tenantId, query),
    queryFn: () => listPlatformTenantSubscriptions(tenantId, query),
  });
}

export function useActivatePlatformTenant() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (tenantId: string) => activatePlatformTenant(tenantId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: platformTenantKeys.all }),
  });
}

export function useDeactivatePlatformTenant() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (tenantId: string) => deactivatePlatformTenant(tenantId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: platformTenantKeys.all }),
  });
}

export type { PlatformTenant, PlatformTenantSubscription };
