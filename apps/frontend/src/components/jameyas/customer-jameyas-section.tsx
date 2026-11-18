'use client';

import { HandCoins } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { DataTable, type Column } from '@/components/shared/data-table';
import { DateText } from '@/components/shared/date-text';
import { EmptyState } from '@/components/shared/empty-state';
import { Money } from '@/components/shared/money';
import { Section } from '@/components/shared/section';
import { StatusBadge } from '@/components/shared/status-badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useJameyaAccess } from '@/hooks/use-jameya-access';
import { useJameyas } from '@/hooks/use-jameyas';
import { Link } from '@/i18n/navigation';
import { JameyaListItem } from '@/lib/api/jameyas';
import { routes } from '@/lib/routes';

export function CustomerJameyasSection({ customerId }: { customerId: string }) {
  const { isJameyaEnabled } = useJameyaAccess();
  if (!isJameyaEnabled) {
    return null;
  }
  return <CustomerJameyasTable customerId={customerId} />;
}

function CustomerJameyasTable({ customerId }: { customerId: string }) {
  const t = useTranslations('jameyas');
  const { data, isLoading, isError } = useJameyas({ customerId, page: 1, limit: 50 });

  const columns: Column<JameyaListItem>[] = [
    {
      id: 'name',
      header: t('list.name'),
      role: 'primary',
      cell: (jameya) => (
        <Link href={routes.jameya(jameya.id)} className="font-medium hover:underline">
          {jameya.name}
        </Link>
      ),
    },
    {
      id: 'pot',
      header: t('list.pot'),
      cell: (jameya) => <Money minorUnits={jameya.potAmount} className="font-medium" />,
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
          '—'
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
    <div className="space-y-3">
      <h2 className="font-heading text-sm font-semibold">{t('customerSection.title')}</h2>
      {isLoading ? (
        <Skeleton className="h-16 w-full rounded-xl" />
      ) : isError || !data || data.data.length === 0 ? (
        <Section>
          <EmptyState
            icon={HandCoins}
            title={isError ? t('list.loadError') : t('customerSection.empty')}
            compact
          />
        </Section>
      ) : (
        <DataTable
          columns={columns}
          rows={data.data}
          keyOf={(jameya) => jameya.id}
          href={(jameya) => routes.jameya(jameya.id)}
        />
      )}
    </div>
  );
}
