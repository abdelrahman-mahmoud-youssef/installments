'use client';

import { Ban, CalendarPlus } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { Button } from '@/components/ui/button';
import {
  PlatformTenant,
  useActivatePlatformTenant,
  useDeactivatePlatformTenant,
} from '@/hooks/use-platform-tenants';
import { ApiError } from '@/lib/api/client';
import { formatDate } from '@/lib/format';
import { TenantSubscriptionHistoryDialog } from './tenant-subscription-history-dialog';

export function TenantActions({ tenant }: { tenant: PlatformTenant }) {
  const t = useTranslations('platform.tenants');
  const activateTenant = useActivatePlatformTenant();
  const deactivateTenant = useDeactivatePlatformTenant();

  function showError(error: unknown) {
    toast.error(error instanceof ApiError ? error.message : t('genericError'));
  }

  async function handleActivate() {
    try {
      const updated = await activateTenant.mutateAsync(tenant.id);
      toast.success(t('activated', { name: updated.name, date: formatDate(updated.subscriptionExpiresOn) }));
    } catch (error) {
      showError(error);
    }
  }

  async function handleDeactivate() {
    try {
      const updated = await deactivateTenant.mutateAsync(tenant.id);
      toast.success(t('deactivated', { name: updated.name }));
    } catch (error) {
      showError(error);
    }
  }

  return (
    <div className="flex items-center justify-end gap-1">
      <ConfirmDialog
        trigger={
          <Button size="sm">
            <CalendarPlus className="size-4" />
            {t('activate')}
          </Button>
        }
        title={t('activateTitle', { name: tenant.name })}
        description={t('activateDescription')}
        confirmLabel={t('activate')}
        onConfirm={handleActivate}
      />
      <TenantSubscriptionHistoryDialog tenant={tenant} />
      <ConfirmDialog
        trigger={
          <Button
            variant="ghost"
            size="icon-sm"
            disabled={tenant.subscriptionStatus === 'EXPIRED'}
            aria-label={t('deactivate')}
            title={t('deactivate')}
            className="text-danger hover:text-danger"
          >
            <Ban className="size-4" />
          </Button>
        }
        title={t('deactivateTitle', { name: tenant.name })}
        description={t('deactivateDescription')}
        confirmLabel={t('deactivate')}
        destructive
        onConfirm={handleDeactivate}
      />
    </div>
  );
}
