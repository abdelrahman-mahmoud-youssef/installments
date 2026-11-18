'use client';

import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Switch } from '@/components/ui/switch';
import { PlatformTenant, useUpdatePlatformTenantFeatures } from '@/hooks/use-platform-tenants';
import { ApiError } from '@/lib/api/client';

export function TenantJameyaSwitch({ tenant }: { tenant: PlatformTenant }) {
  const t = useTranslations('platform.tenants');
  const updateFeatures = useUpdatePlatformTenantFeatures();

  async function handleChange(jameyaEnabled: boolean) {
    try {
      const updated = await updateFeatures.mutateAsync({ tenantId: tenant.id, jameyaEnabled });
      toast.success(t(updated.jameyaEnabled ? 'jameyaTurnedOn' : 'jameyaTurnedOff', { name: updated.name }));
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : t('genericError'));
    }
  }

  return (
    <Switch
      checked={tenant.jameyaEnabled}
      disabled={updateFeatures.isPending}
      onCheckedChange={handleChange}
      aria-label={t('jameyaToggle', { name: tenant.name })}
    />
  );
}
