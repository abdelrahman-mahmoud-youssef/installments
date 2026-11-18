'use client';

import { HandCoins, Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { DataTable, type Column } from '@/components/shared/data-table';
import { DateText } from '@/components/shared/date-text';
import { EmptyState } from '@/components/shared/empty-state';
import { Money } from '@/components/shared/money';
import { FadeIn } from '@/components/shared/motion';
import { PageHeader } from '@/components/shared/page-header';
import { PaginationControls } from '@/components/shared/pagination-controls';
import { SearchInput } from '@/components/shared/search-input';
import { Section } from '@/components/shared/section';
import { TableSkeleton } from '@/components/shared/skeletons';
import { StatusBadge } from '@/components/shared/status-badge';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { useJameyas } from '@/hooks/use-jameyas';
import { ApiError } from '@/lib/api/client';
import { Link } from '@/i18n/navigation';
import { JameyaListItem } from '@/lib/api/jameyas';
import { JAMEYA_STATUSES, JameyaStatus } from '@/lib/enums';
import { routes } from '@/lib/routes';

const SEARCH_DEBOUNCE_MS = 300;

export default function JameyasPage() {
  const t = useTranslations('jameyas');
  const tCommon = useTranslations('common');
  const tStatus = useTranslations('status');
  const [status, setStatus] = useState<JameyaStatus>('ACTIVE');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebouncedValue(search, SEARCH_DEBOUNCE_MS);
  const { data, isLoading, isError, error } = useJameyas({ status, q: debouncedSearch || undefined, page, limit: 20 });

  const columns: Column<JameyaListItem>[] = [
    {
      id: 'name',
      header: t('list.name'),
      role: 'primary',
      cell: (jameya) => (
        <Link href={routes.jameya(jameya.id)} className="flex items-center gap-2 font-medium hover:underline">
          {jameya.name}
          {jameya.lateDueCount > 0 && (
            <Badge variant="destructive" className="shrink-0">
              {t('list.lateCount', { count: jameya.lateDueCount })}
            </Badge>
          )}
        </Link>
      ),
    },
    {
      id: 'pot',
      header: t('list.pot'),
      cell: (jameya) => <Money minorUnits={jameya.potAmount} className="font-medium" />,
    },
    {
      id: 'members',
      header: t('list.members'),
      cell: (jameya) => <span className="text-muted-foreground tabular-nums">{jameya.shareCount}</span>,
    },
    {
      id: 'next',
      header: t('list.nextCycle'),
      cell: (jameya) =>
        jameya.nextCycle ? (
          <span className="text-muted-foreground">
            {t('list.nextCycleValue', { sequence: jameya.nextCycle.sequence })} ·{' '}
            <DateText value={jameya.nextCycle.dueDate} />
          </span>
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },
    {
      id: 'status',
      header: t('list.status'),
      role: 'trailing',
      cell: (jameya) => <StatusBadge status={jameya.status} />,
    },
  ];

  return (
    <div className="space-y-6">
      <FadeIn>
        <PageHeader
          title={t('title')}
          description={t('subtitle')}
          actions={
            <Button render={<Link href={routes.newJameya} />}>
              <Plus className="size-4" />
              {t('newJameya')}
            </Button>
          }
        />
      </FadeIn>

      <FadeIn delay={0.05} className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Tabs
            value={status}
            onValueChange={(value) => {
              setStatus(value as JameyaStatus);
              setPage(1);
            }}
          >
            <div className="-mx-1 overflow-x-auto px-1">
              <TabsList className="min-w-fit">
                {JAMEYA_STATUSES.map((value) => (
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
            placeholder={t('list.searchPlaceholder')}
          />
        </div>

        {isLoading ? (
          <TableSkeleton />
        ) : isError || !data ? (
          <Section>
            <EmptyState
              icon={HandCoins}
              title={t('list.loadError')}
              description={error instanceof ApiError ? error.message : tCommon('tryAgain')}
            />
          </Section>
        ) : data.data.length === 0 ? (
          <Section>
            <EmptyState
              icon={HandCoins}
              title={t('list.empty')}
              description={t('list.createPrompt')}
              action={
                <Button size="sm" render={<Link href={routes.newJameya} />}>
                  <Plus className="size-4" />
                  {t('newJameya')}
                </Button>
              }
            />
          </Section>
        ) : (
          <div className="space-y-4">
            <DataTable
              columns={columns}
              rows={data.data}
              keyOf={(jameya) => jameya.id}
              href={(jameya) => routes.jameya(jameya.id)}
            />
            <PaginationControls page={data.page} totalPages={data.totalPages} onPageChange={setPage} />
          </div>
        )}
      </FadeIn>
    </div>
  );
}
