'use client';

import { History, ReceiptText } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { DateText } from '@/components/shared/date-text';
import { EmptyState } from '@/components/shared/empty-state';
import { Money } from '@/components/shared/money';
import { PaginationControls } from '@/components/shared/pagination-controls';
import { TableSkeleton } from '@/components/shared/skeletons';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { PlatformTenant, usePlatformTenantSubscriptions } from '@/hooks/use-platform-tenants';

const HISTORY_PAGE_SIZE = 10;

function SubscriptionHistoryList({ tenantId }: { tenantId: string }) {
  const t = useTranslations('platform.tenants');
  const [page, setPage] = useState(1);
  const { data, isLoading, isError } = usePlatformTenantSubscriptions(tenantId, { page, limit: HISTORY_PAGE_SIZE });

  if (isLoading) {
    return <TableSkeleton rows={3} />;
  }
  if (isError || !data) {
    return <EmptyState icon={ReceiptText} title={t('historyLoadError')} compact />;
  }
  if (data.data.length === 0) {
    return <EmptyState icon={ReceiptText} title={t('historyEmpty')} compact />;
  }

  return (
    <div className="space-y-3">
      <ul className="divide-y divide-border rounded-lg border border-border">
        {data.data.map((record) => (
          <li key={record.id} className="flex items-center justify-between gap-3 px-3 py-2.5">
            <div className="min-w-0 space-y-0.5">
              <p className="text-sm font-medium tabular-nums">
                <DateText value={record.periodStart} /> – <DateText value={record.periodEnd} />
              </p>
              {record.activatedBy && (
                <p className="truncate text-xs text-muted-foreground">
                  {t('activatedBy', { name: record.activatedBy.name })}
                </p>
              )}
            </div>
            <Money minorUnits={record.amount} className="shrink-0 text-sm font-medium" />
          </li>
        ))}
      </ul>
      <PaginationControls page={data.page} totalPages={data.totalPages} onPageChange={setPage} />
    </div>
  );
}

export function TenantSubscriptionHistoryDialog({ tenant }: { tenant: PlatformTenant }) {
  const t = useTranslations('platform.tenants');
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant="ghost" size="icon-sm" aria-label={t('history')} title={t('history')}>
            <History className="size-4" />
          </Button>
        }
      />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('historyTitle', { name: tenant.name })}</DialogTitle>
        </DialogHeader>
        {open && <SubscriptionHistoryList tenantId={tenant.id} />}
      </DialogContent>
    </Dialog>
  );
}
