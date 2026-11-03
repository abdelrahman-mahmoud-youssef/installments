'use client';

import { Inbox } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { PlatformSupportMessageCard } from '@/components/platform/platform-support-message-card';
import { EmptyState } from '@/components/shared/empty-state';
import { FadeIn } from '@/components/shared/motion';
import { PageHeader } from '@/components/shared/page-header';
import { PaginationControls } from '@/components/shared/pagination-controls';
import { Section } from '@/components/shared/section';
import { PanelSkeleton } from '@/components/shared/skeletons';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { usePlatformSupportMessages } from '@/hooks/use-platform-support';
import { SupportReplyState } from '@/lib/api/platform';

const ALL_MESSAGES = 'ALL';
const SUPPORT_PAGE_SIZE = 20;

type ReplyStateFilter = SupportReplyState | typeof ALL_MESSAGES;

export default function PlatformSupportPage() {
  const t = useTranslations('platform.support');
  const [state, setState] = useState<ReplyStateFilter>('AWAITING_REPLY');
  const [page, setPage] = useState(1);

  const { data, isLoading, isError } = usePlatformSupportMessages({
    state: state === ALL_MESSAGES ? undefined : state,
    page,
    limit: SUPPORT_PAGE_SIZE,
  });

  return (
    <div className="space-y-6">
      <FadeIn>
        <PageHeader title={t('title')} description={t('subtitle')} />
      </FadeIn>

      <FadeIn delay={0.05} className="space-y-4">
        <Tabs
          value={state}
          onValueChange={(value) => {
            setState(value as ReplyStateFilter);
            setPage(1);
          }}
        >
          <div className="-mx-1 overflow-x-auto px-1">
            <TabsList className="min-w-fit">
              <TabsTrigger value="AWAITING_REPLY" className="shrink-0">
                {t('awaitingReply')}
              </TabsTrigger>
              <TabsTrigger value="REPLIED" className="shrink-0">
                {t('replied')}
              </TabsTrigger>
              <TabsTrigger value={ALL_MESSAGES} className="shrink-0">
                {t('all')}
              </TabsTrigger>
            </TabsList>
          </div>
        </Tabs>

        {isLoading ? (
          <div className="space-y-3">
            <PanelSkeleton />
            <PanelSkeleton />
          </div>
        ) : isError || !data ? (
          <Section>
            <EmptyState icon={Inbox} title={t('loadError')} />
          </Section>
        ) : data.data.length === 0 ? (
          <Section>
            <EmptyState icon={Inbox} title={state === 'AWAITING_REPLY' ? t('emptyAwaiting') : t('empty')} />
          </Section>
        ) : (
          <div className="space-y-3">
            {data.data.map((message) => (
              <PlatformSupportMessageCard key={message.id} message={message} />
            ))}
            <PaginationControls page={data.page} totalPages={data.totalPages} onPageChange={setPage} />
          </div>
        )}
      </FadeIn>
    </div>
  );
}
