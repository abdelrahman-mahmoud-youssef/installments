'use client';

import { HandCoins } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { DataTable, type Column } from '@/components/shared/data-table';
import { EmptyState } from '@/components/shared/empty-state';
import { Money } from '@/components/shared/money';
import { Section } from '@/components/shared/section';
import { StatusBadge } from '@/components/shared/status-badge';
import { Badge } from '@/components/ui/badge';
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
        <Link href={routes.jameya(jameya.id)} className="flex items-center gap-2 font-medium hover:underline">
          {jameya.name}
          {jameya.member && jameya.member.lateAmount > 0 && (
            <Badge variant="destructive" className="shrink-0">
              {t('customerSection.late')} <Money minorUnits={jameya.member.lateAmount} hideWholeDecimals />
            </Badge>
          )}
        </Link>
      ),
    },
    {
      id: 'turn',
      header: t('customerSection.turn'),
      cell: (jameya) =>
        jameya.member ? (
          <span className="text-muted-foreground">
            {jameya.member.turnSequences.length > 1
              ? t('customerSection.turnsValue', {
                  sequences: jameya.member.turnSequences.join(t('customerSection.sequenceSeparator')),
                })
              : t('customerSection.turnValue', { sequence: jameya.member.turnSequences[0] })}
          </span>
        ) : null,
    },
    {
      id: 'monthly',
      header: t('customerSection.pays'),
      cell: (jameya) =>
        jameya.member ? (
          <span>
            <Money minorUnits={jameya.member.monthlyAmount} hideWholeDecimals className="font-medium" />{' '}
            <span className="text-muted-foreground">{t(`detail.period.${jameya.recurrenceType}`)}</span>
          </span>
        ) : null,
    },
    {
      id: 'owes',
      header: t('customerSection.owes'),
      cell: (jameya) =>
        jameya.member ? <Money minorUnits={jameya.member.remainingAmount} hideWholeDecimals className="font-medium" /> : null,
    },
    {
      id: 'received',
      header: t('customerSection.received'),
      cell: (jameya) =>
        jameya.member ? <Money minorUnits={jameya.member.receivedAmount} hideWholeDecimals className="text-muted-foreground" /> : null,
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
