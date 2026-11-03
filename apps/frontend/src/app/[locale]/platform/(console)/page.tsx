'use client';

import { SearchX, Store } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { PlatformTenantsTable } from '@/components/platform/platform-tenants-table';
import { EmptyState } from '@/components/shared/empty-state';
import { FadeIn } from '@/components/shared/motion';
import { PageHeader } from '@/components/shared/page-header';
import { PaginationControls } from '@/components/shared/pagination-controls';
import { SearchInput } from '@/components/shared/search-input';
import { Section } from '@/components/shared/section';
import { TableSkeleton } from '@/components/shared/skeletons';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { usePlatformTenants } from '@/hooks/use-platform-tenants';
import { SUBSCRIPTION_STATUSES, SubscriptionStatus } from '@/lib/enums';

const ALL_STATUSES = 'ALL';
const TENANTS_PAGE_SIZE = 20;

type StatusFilter = SubscriptionStatus | typeof ALL_STATUSES;

export default function PlatformTenantsPage() {
  const t = useTranslations('platform.tenants');
  const tStatus = useTranslations('status');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<StatusFilter>(ALL_STATUSES);
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebouncedValue(search, 300);

  const { data, isLoading, isError } = usePlatformTenants({
    q: debouncedSearch || undefined,
    status: status === ALL_STATUSES ? undefined : status,
    page,
    limit: TENANTS_PAGE_SIZE,
  });
  const isFiltered = Boolean(debouncedSearch) || status !== ALL_STATUSES;

  return (
    <div className="space-y-6">
      <FadeIn>
        <PageHeader title={t('title')} description={t('subtitle')} />
      </FadeIn>

      <FadeIn delay={0.05} className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Tabs
            value={status}
            onValueChange={(value) => {
              setStatus(value as StatusFilter);
              setPage(1);
            }}
          >
            <div className="-mx-1 overflow-x-auto px-1">
              <TabsList className="min-w-fit">
                <TabsTrigger value={ALL_STATUSES} className="shrink-0">
                  {t('all')}
                </TabsTrigger>
                {SUBSCRIPTION_STATUSES.map((value) => (
                  <TabsTrigger key={value} value={value} className="shrink-0">
                    {tStatus(value)}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>
          </Tabs>
          <SearchInput
            value={search}
            onChange={(value) => {
              setSearch(value);
              setPage(1);
            }}
            placeholder={t('searchPlaceholder')}
            className="w-full sm:max-w-sm"
          />
        </div>

        {isLoading ? (
          <TableSkeleton />
        ) : isError || !data ? (
          <Section>
            <EmptyState icon={Store} title={t('loadError')} />
          </Section>
        ) : data.data.length === 0 ? (
          <Section>
            <EmptyState
              icon={isFiltered ? SearchX : Store}
              title={isFiltered ? t('noResults') : t('noShops')}
            />
          </Section>
        ) : (
          <div className="space-y-4">
            <PlatformTenantsTable tenants={data.data} />
            <PaginationControls page={data.page} totalPages={data.totalPages} onPageChange={setPage} />
          </div>
        )}
      </FadeIn>
    </div>
  );
}
