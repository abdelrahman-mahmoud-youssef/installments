'use client';

import { Bell, History, Megaphone } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useState } from 'react';
import { FaTelegram, FaWhatsapp } from 'react-icons/fa6';
import { EmptyState } from '@/components/shared/empty-state';
import { PaginationControls } from '@/components/shared/pagination-controls';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useCustomerNotifications } from '@/hooks/use-customers';
import type { CustomerNotificationChannel, CustomerNotificationHistoryItem } from '@/lib/api/customers';
import { formatDateTime } from '@/lib/format';
import { cn } from '@/lib/utils';

const CHANNEL_ICON: Record<CustomerNotificationChannel, typeof FaTelegram> = {
  TELEGRAM: FaTelegram,
  WHATSAPP: FaWhatsapp,
};

function NotificationRow({ item }: { item: CustomerNotificationHistoryItem }) {
  const t = useTranslations('customers.detail');
  const locale = useLocale();
  const ChannelIcon = CHANNEL_ICON[item.channel];
  const TypeIcon = item.type === 'BROADCAST' ? Megaphone : Bell;

  return (
    <div className="flex items-start gap-3 rounded-lg border border-border bg-card p-3">
      <div className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-full bg-muted text-muted-foreground">
        <TypeIcon className="size-4" strokeWidth={1.8} />
      </div>
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex items-center gap-1.5 text-sm font-medium">
          <span>{item.type === 'BROADCAST' ? t('historyBroadcast') : t('historyReminder')}</span>
          <ChannelIcon className="size-3.5 text-muted-foreground" />
        </div>
        {item.preview && <p className="truncate text-sm text-muted-foreground">{item.preview}</p>}
        {!item.success && item.error && <p className="text-sm text-danger">{item.error}</p>}
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1">
        <span
          className={cn(
            'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap',
            item.success ? 'bg-success-soft text-success' : 'bg-danger-soft text-danger',
          )}
        >
          {item.success ? t('historyDelivered') : t('historyFailed')}
        </span>
        <span className="text-xs text-muted-foreground tabular-nums">{formatDateTime(item.sentAt, locale)}</span>
      </div>
    </div>
  );
}

export function CustomerNotificationHistoryDialog({
  customerId,
  customerName,
  open,
  onOpenChange,
}: {
  customerId: string;
  customerName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useTranslations('customers.detail');
  const [page, setPage] = useState(1);

  const { data, isLoading, isError } = useCustomerNotifications(customerId, { page, limit: 10 }, open);

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
        if (!next) {
          setPage(1);
        }
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t('historyTitle')}</DialogTitle>
          <DialogDescription>{t('historyDescription', { name: customerName })}</DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-16 rounded-lg" />
            <Skeleton className="h-16 rounded-lg" />
            <Skeleton className="h-16 rounded-lg" />
          </div>
        ) : isError || !data ? (
          <EmptyState icon={History} title={t('historyLoadError')} compact />
        ) : data.data.length === 0 ? (
          <EmptyState icon={History} title={t('historyEmpty')} compact />
        ) : (
          <div className="space-y-3">
            <div className="max-h-96 space-y-2 overflow-y-auto">
              {data.data.map((item) => (
                <NotificationRow key={`${item.type}-${item.id}`} item={item} />
              ))}
            </div>
            <PaginationControls page={data.page} totalPages={data.totalPages} onPageChange={setPage} />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
