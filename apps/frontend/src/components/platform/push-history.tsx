'use client';

import { BellOff } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { DateText } from '@/components/shared/date-text';
import { EmptyState } from '@/components/shared/empty-state';
import { PaginationControls } from '@/components/shared/pagination-controls';
import { Section } from '@/components/shared/section';
import { PanelSkeleton } from '@/components/shared/skeletons';
import { usePlatformPushAnnouncements } from '@/hooks/use-platform-push';

const HISTORY_PAGE_SIZE = 10;

export function PushHistory() {
  const t = useTranslations('platform.notifications');
  const [page, setPage] = useState(1);
  const { data, isLoading, isError } = usePlatformPushAnnouncements({ page, limit: HISTORY_PAGE_SIZE });

  return (
    <Section title={t('historyTitle')}>
      {isLoading ? (
        <PanelSkeleton />
      ) : isError || !data ? (
        <EmptyState icon={BellOff} title={t('loadError')} compact />
      ) : data.data.length === 0 ? (
        <EmptyState icon={BellOff} title={t('empty')} compact />
      ) : (
        <div className="space-y-4">
          <ul className="divide-y divide-border">
            {data.data.map((announcement) => (
              <li key={announcement.id} className="space-y-1 py-3 first:pt-0 last:pb-0">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm font-medium">{announcement.title}</p>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    <DateText value={announcement.createdAt} />
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">{announcement.body}</p>
                <p className="text-xs text-muted-foreground">
                  {announcement.shopName ?? (announcement.audience ? t(`audience.${announcement.audience}`) : '')}
                  {' · '}
                  {t('recipients', { count: announcement.recipientCount })}
                </p>
              </li>
            ))}
          </ul>
          <PaginationControls page={data.page} totalPages={data.totalPages} onPageChange={setPage} />
        </div>
      )}
    </Section>
  );
}
