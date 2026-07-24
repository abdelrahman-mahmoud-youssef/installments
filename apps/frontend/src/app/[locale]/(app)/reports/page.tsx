'use client';

import { AlertTriangle, CalendarClock, CalendarDays, FileText, TrendingUp, Users, Wallet } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { DataTable, type Column } from '@/components/shared/data-table';
import { EmptyState } from '@/components/shared/empty-state';
import { InitialAvatar } from '@/components/shared/initial-avatar';
import { MetricCard } from '@/components/shared/metric-card';
import { Money } from '@/components/shared/money';
import { FadeIn, Stagger, StaggerItem } from '@/components/shared/motion';
import { PageHeader } from '@/components/shared/page-header';
import { Section } from '@/components/shared/section';
import { MetricsSkeleton, TableSkeleton } from '@/components/shared/skeletons';
import { Link } from '@/i18n/navigation';
import type { OverdueCustomerSummary } from '@/lib/api/reports';
import { useReports } from '@/hooks/use-reports';
import { routes } from '@/lib/routes';

export default function ReportsPage() {
  const t = useTranslations('reports');
  const tCommon = useTranslations('common');
  const { data, isLoading, isError } = useReports();

  const header = <PageHeader title={t('title')} description={t('subtitle')} />;

  if (isLoading) {
    return (
      <div className="space-y-6">
        {header}
        <MetricsSkeleton count={3} />
        <MetricsSkeleton count={4} />
        <TableSkeleton />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="space-y-6">
        {header}
        <Section>
          <EmptyState icon={AlertTriangle} title={t('loadError')} description={tCommon('tryAgain')} />
        </Section>
      </div>
    );
  }

  const columns: Column<OverdueCustomerSummary>[] = [
    {
      id: 'customer',
      header: t('customer'),
      role: 'primary',
      cell: (customer) => (
        <Link href={routes.customer(customer.customerId)} className="group flex items-center gap-3">
          <InitialAvatar name={customer.customerName} className="size-9 text-xs" />
          <span className="truncate font-medium group-hover:underline">{customer.customerName}</span>
        </Link>
      ),
    },
    {
      id: 'phone',
      header: t('phone'),
      cell: (customer) => (
        <span dir="ltr" className="text-muted-foreground tabular-nums">
          {customer.customerPhone}
        </span>
      ),
    },
    {
      id: 'count',
      header: t('overdueInstallments'),
      cell: (customer) => <span className="tabular-nums">{customer.overdueInstallmentCount}</span>,
    },
    {
      id: 'balance',
      header: t('overdueBalance'),
      role: 'trailing',
      align: 'end',
      cell: (customer) => <Money minorUnits={customer.overdueBalance} className="font-semibold text-danger" />,
    },
  ];

  return (
    <div className="space-y-6">
      <FadeIn>{header}</FadeIn>

      <Stagger className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StaggerItem>
          <MetricCard
            label={t('todayCollections')}
            value={<Money minorUnits={data.todayCollections} />}
            icon={Wallet}
            tone="success"
            emphasis
          />
        </StaggerItem>
        <StaggerItem>
          <MetricCard
            label={t('monthCollections')}
            value={<Money minorUnits={data.monthlyCollections} />}
            icon={TrendingUp}
            tone="primary"
            emphasis
          />
        </StaggerItem>
        <StaggerItem>
          <MetricCard
            label={t('overdueBalance')}
            value={<Money minorUnits={data.overdueBalance} />}
            icon={CalendarDays}
            tone={data.overdueBalance > 0 ? 'danger' : 'neutral'}
            emphasis={data.overdueBalance > 0}
          />
        </StaggerItem>
      </Stagger>

      <FadeIn delay={0.05} className="space-y-3">
        <h2 className="font-heading text-sm font-semibold">{t('overview')}</h2>
        <Stagger className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StaggerItem>
            <MetricCard label={t('totalContracts')} value={data.totalContracts} icon={FileText} tone="primary" />
          </StaggerItem>
          <StaggerItem>
            <MetricCard
              label={t('activeContracts')}
              value={data.activeContracts}
              icon={TrendingUp}
              tone="success"
            />
          </StaggerItem>
          <StaggerItem>
            <MetricCard label={t('totalCustomers')} value={data.totalCustomers} icon={Users} tone="neutral" />
          </StaggerItem>
          <StaggerItem>
            <MetricCard
              label={t('installmentsThisMonth')}
              value={data.installmentsThisMonth}
              icon={CalendarClock}
              tone="info"
            />
          </StaggerItem>
        </Stagger>
      </FadeIn>

      <FadeIn delay={0.1} className="space-y-3">
        <h2 className="font-heading text-sm font-semibold">{t('overdueCustomers')}</h2>
        {data.overdueCustomers.length === 0 ? (
          <Section>
            <EmptyState icon={TrendingUp} title={t('noOverdueCustomers')} compact />
          </Section>
        ) : (
          <DataTable
            columns={columns}
            rows={data.overdueCustomers}
            keyOf={(customer) => customer.customerId}
            href={(customer) => routes.customer(customer.customerId)}
          />
        )}
      </FadeIn>
    </div>
  );
}
