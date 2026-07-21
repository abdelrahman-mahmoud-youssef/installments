'use client';

import { History } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useState } from 'react';
import { EmptyState } from '@/components/shared/empty-state';
import { DataTable, type Column } from '@/components/shared/data-table';
import { FadeIn } from '@/components/shared/motion';
import { PageHeader } from '@/components/shared/page-header';
import { PaginationControls } from '@/components/shared/pagination-controls';
import { Section } from '@/components/shared/section';
import { TableSkeleton } from '@/components/shared/skeletons';
import { useAuditLog } from '@/hooks/use-audit-log';
import type { AuditLogEntry } from '@/lib/api/audit';
import { formatDateTime } from '@/lib/format';

export default function ActivityPage() {
  const t = useTranslations('activity');
  const tCommon = useTranslations('common');
  const locale = useLocale();
  const [page, setPage] = useState(1);

  const { data, isLoading, isError } = useAuditLog({ page, limit: 20 });

  const columns: Column<AuditLogEntry>[] = [
    {
      id: 'actor',
      header: t('actor'),
      role: 'primary',
      cell: (entry) => (
        <span dir="ltr" className="text-left font-medium">
          {entry.userEmail}
        </span>
      ),
    },
    {
      id: 'action',
      header: t('action'),
      cell: (entry) => {
        const key = `action_${entry.action.replace(/\./g, '_')}`;
        return <span>{t.has(key) ? t(key) : entry.action}</span>;
      },
    },
    {
      id: 'entity',
      header: t('entity'),
      cell: (entry) => <span className="text-muted-foreground">{entry.entityType}</span>,
    },
    {
      id: 'date',
      header: t('date'),
      align: 'end',
      cell: (entry) => (
        <span className="text-muted-foreground tabular-nums">{formatDateTime(entry.createdAt, locale)}</span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <FadeIn>
        <PageHeader title={t('title')} description={t('subtitle')} />
      </FadeIn>

      <FadeIn delay={0.05} className="space-y-4">
        {isLoading ? (
          <TableSkeleton />
        ) : isError || !data ? (
          <Section>
            <EmptyState icon={History} title={t('loadError')} description={tCommon('tryAgain')} />
          </Section>
        ) : data.data.length === 0 ? (
          <Section>
            <EmptyState icon={History} title={t('empty')} />
          </Section>
        ) : (
          <div className="space-y-4">
            <DataTable columns={columns} rows={data.data} keyOf={(entry) => entry.id} />
            <PaginationControls page={data.page} totalPages={data.totalPages} onPageChange={setPage} />
          </div>
        )}
      </FadeIn>
    </div>
  );
}
