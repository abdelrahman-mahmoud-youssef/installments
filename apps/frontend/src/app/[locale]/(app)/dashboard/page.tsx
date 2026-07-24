'use client';

import {
  AlertTriangle,
  ArrowDownLeft,
  CalendarClock,
  CalendarRange,
  FileText,
  FileWarning,
  Plus,
  Users,
  Wallet,
} from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { BarChart, type BarDatum } from '@/components/shared/bar-chart';
import { DateText } from '@/components/shared/date-text';
import { EmptyState } from '@/components/shared/empty-state';
import { MetricCard } from '@/components/shared/metric-card';
import { Money } from '@/components/shared/money';
import { FadeIn, Stagger, StaggerItem } from '@/components/shared/motion';
import { PageHeader } from '@/components/shared/page-header';
import { Section } from '@/components/shared/section';
import { MetricsSkeleton, PanelSkeleton } from '@/components/shared/skeletons';
import { Button } from '@/components/ui/button';
import { Link } from '@/i18n/navigation';
import type { DashboardInstallmentSummary, DashboardPaymentSummary } from '@/lib/api/dashboard';
import { useDashboard } from '@/hooks/use-dashboard';
import { formatWeekday } from '@/lib/format';
import { routes } from '@/lib/routes';

function buildUpcoming(items: DashboardInstallmentSummary[], locale: string): BarDatum[] {
  const now = new Date();
  const start = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  return Array.from({ length: 7 }, (_, index) => {
    const day = new Date(start + (index + 1) * 86_400_000);
    const key = day.toISOString().slice(0, 10);
    const value = items
      .filter((item) => item.dueDate.slice(0, 10) === key)
      .reduce((sum, item) => sum + (item.amount - item.paidAmount), 0);
    return { label: formatWeekday(day, locale), value };
  });
}

function InstallmentRow({
  installment,
  tone,
}: {
  installment: DashboardInstallmentSummary;
  tone?: 'danger';
}) {
  return (
    <Link
      href={routes.contract(installment.contractId)}
      className="-mx-2 flex items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-accent/50"
    >
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{installment.customerName}</p>
        <p className="truncate text-xs text-muted-foreground">{installment.productName}</p>
      </div>
      <div className="text-end">
        <Money
          minorUnits={installment.amount - installment.paidAmount}
          className={tone === 'danger' ? 'text-sm font-semibold text-danger' : 'text-sm font-semibold'}
        />
        <p className="text-xs text-muted-foreground">
          <DateText value={installment.dueDate} />
        </p>
      </div>
    </Link>
  );
}

function PaymentRow({ payment }: { payment: DashboardPaymentSummary }) {
  return (
    <Link
      href={routes.contract(payment.contractId)}
      className="-mx-2 flex items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-accent/50"
    >
      <span className="grid size-8 shrink-0 place-items-center rounded-full bg-success-soft text-success">
        <ArrowDownLeft className="size-4 rtl:rotate-90" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{payment.customerName}</p>
        <p className="text-xs text-muted-foreground">
          <DateText value={payment.paidAt} />
        </p>
      </div>
      <Money minorUnits={payment.amount} className="text-sm font-semibold text-success" />
    </Link>
  );
}

export default function DashboardPage() {
  const t = useTranslations('dashboard');
  const tCommon = useTranslations('common');
  const locale = useLocale();
  const { data, isLoading, isError } = useDashboard();

  const header = (
    <PageHeader
      title={t('title')}
      description={t('subtitle')}
      actions={
        <Button render={<Link href={routes.newContract} />}>
          <Plus className="size-4" />
          {t('newContract')}
        </Button>
      }
    />
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        {header}
        <MetricsSkeleton count={8} />
        <div className="grid gap-5 lg:grid-cols-3">
          <PanelSkeleton className="lg:col-span-2" />
          <PanelSkeleton />
        </div>
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

  const upcoming = buildUpcoming(data.dueNext7Days, locale);

  return (
    <div className="space-y-6">
      <FadeIn>{header}</FadeIn>

      <Stagger className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StaggerItem>
          <MetricCard
            label={t('expectedToday')}
            value={<Money minorUnits={data.totalExpectedToday} />}
            icon={Wallet}
            tone="success"
            emphasis
          />
        </StaggerItem>
        <StaggerItem>
          <MetricCard label={t('dueToday')} value={data.dueToday.length} icon={CalendarClock} tone="primary" />
        </StaggerItem>
        <StaggerItem>
          <MetricCard
            label={t('overdue')}
            value={data.overdue.length}
            icon={AlertTriangle}
            tone={data.overdue.length > 0 ? 'danger' : 'neutral'}
            emphasis={data.overdue.length > 0}
          />
        </StaggerItem>
        <StaggerItem>
          <MetricCard
            label={t('dueNext7Days')}
            value={data.dueNext7Days.length}
            icon={CalendarRange}
            tone="info"
          />
        </StaggerItem>
        <StaggerItem>
          <MetricCard label={t('activeContracts')} value={data.activeContracts} icon={FileText} tone="primary" />
        </StaggerItem>
        <StaggerItem>
          <MetricCard label={t('totalCustomers')} value={data.totalCustomers} icon={Users} tone="neutral" />
        </StaggerItem>
        <StaggerItem>
          <MetricCard
            label={t('overdueBalance')}
            value={<Money minorUnits={data.overdueBalance} />}
            icon={AlertTriangle}
            tone={data.overdueBalance > 0 ? 'danger' : 'neutral'}
            emphasis={data.overdueBalance > 0}
          />
        </StaggerItem>
        <StaggerItem>
          <MetricCard
            label={t('pendingPaymentClaims')}
            value={data.pendingPaymentClaims}
            icon={FileWarning}
            tone={data.pendingPaymentClaims > 0 ? 'warning' : 'neutral'}
          />
        </StaggerItem>
      </Stagger>

      <div className="grid gap-5 lg:grid-cols-3">
        <FadeIn className="lg:col-span-2" delay={0.05}>
          <Section title={t('upcomingCollections')} description={t('upcomingCollectionsHint')}>
            <BarChart data={upcoming} />
          </Section>
        </FadeIn>
        <FadeIn delay={0.1}>
          <Section title={t('recentPayments')}>
            {data.recentPayments.length === 0 ? (
              <EmptyState icon={ArrowDownLeft} title={t('noPayments')} compact />
            ) : (
              <div className="space-y-0.5">
                {data.recentPayments.slice(0, 6).map((payment) => (
                  <PaymentRow key={payment.id} payment={payment} />
                ))}
              </div>
            )}
          </Section>
        </FadeIn>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <FadeIn delay={0.1}>
          <Section title={t('dueToday')}>
            {data.dueToday.length === 0 ? (
              <EmptyState icon={CalendarClock} title={t('nothingDueToday')} compact />
            ) : (
              <div className="space-y-0.5">
                {data.dueToday.slice(0, 6).map((installment) => (
                  <InstallmentRow key={installment.id} installment={installment} />
                ))}
              </div>
            )}
          </Section>
        </FadeIn>
        <FadeIn delay={0.15}>
          <Section title={t('overdue')}>
            {data.overdue.length === 0 ? (
              <EmptyState icon={AlertTriangle} title={t('noOverdue')} compact />
            ) : (
              <div className="space-y-0.5">
                {data.overdue.slice(0, 6).map((installment) => (
                  <InstallmentRow key={installment.id} installment={installment} tone="danger" />
                ))}
              </div>
            )}
          </Section>
        </FadeIn>
      </div>
    </div>
  );
}
