'use client';

import { useTranslations } from 'next-intl';
import { Column, DataTable } from '@/components/shared/data-table';
import { DateText } from '@/components/shared/date-text';
import { StatusBadge } from '@/components/shared/status-badge';
import { PlatformTenant } from '@/hooks/use-platform-tenants';
import { TenantActions } from './tenant-actions';
import { TenantJameyaSwitch } from './tenant-jameya-switch';

export function PlatformTenantsTable({ tenants }: { tenants: PlatformTenant[] }) {
  const t = useTranslations('platform.tenants');

  const columns: Column<PlatformTenant>[] = [
    {
      id: 'shop',
      header: t('shop'),
      role: 'primary',
      cell: (tenant) => (
        <div className="min-w-0">
          <p className="truncate font-medium">{tenant.name}</p>
          <p className="truncate text-xs text-muted-foreground">
            <span dir="ltr">{tenant.slug}</span>
          </p>
        </div>
      ),
    },
    {
      id: 'owner',
      header: t('owner'),
      cell: (tenant) =>
        tenant.owner ? (
          <div className="min-w-0">
            <p className="truncate">{tenant.owner.name}</p>
            <p className="truncate text-xs text-muted-foreground">
              <span dir="ltr">{tenant.owner.email}</span>
            </p>
          </div>
        ) : (
          <span className="text-muted-foreground">{t('noOwner')}</span>
        ),
    },
    {
      id: 'referrals',
      header: t('referrals'),
      cell: (tenant) => (
        <div className="min-w-0 text-sm">
          <p className="tabular-nums">{t('invitedShops', { count: tenant.invitedShopsCount })}</p>
          {tenant.referredBy && (
            <p className="truncate text-xs text-muted-foreground">
              {t('invitedBy', { name: tenant.referredBy.name })}
            </p>
          )}
        </div>
      ),
    },
    {
      id: 'status',
      header: t('status'),
      cell: (tenant) => <StatusBadge status={tenant.subscriptionStatus} />,
    },
    {
      id: 'expiresOn',
      header: t('expiresOn'),
      cell: (tenant) => <DateText value={tenant.subscriptionExpiresOn} className="tabular-nums" />,
    },
    {
      id: 'jameya',
      header: t('jameya'),
      cell: (tenant) => <TenantJameyaSwitch tenant={tenant} />,
    },
    {
      id: 'actions',
      header: t('actions'),
      role: 'action',
      align: 'end',
      headerHidden: true,
      cell: (tenant) => <TenantActions tenant={tenant} />,
    },
  ];

  return <DataTable columns={columns} rows={tenants} keyOf={(tenant) => tenant.id} />;
}
