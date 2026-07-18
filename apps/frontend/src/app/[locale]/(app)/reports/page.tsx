'use client';

import { useTranslations } from 'next-intl';
import { EmptyState } from '@/components/shared/empty-state';
import { Money } from '@/components/shared/money';
import { PageHeader } from '@/components/shared/page-header';
import { StatCard } from '@/components/shared/stat-card';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Link } from '@/i18n/navigation';
import { useReports } from '@/hooks/use-reports';
import { routes } from '@/lib/routes';

export default function ReportsPage() {
  const t = useTranslations('reports');
  const tCommon = useTranslations('common');
  const { data, isLoading, isError } = useReports();

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title={t('title')} />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title={t('title')} />
        <EmptyState title={t('loadError')} description={tCommon('tryAgain')} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={t('title')} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label={t('todayCollections')} value={<Money minorUnits={data.todayCollections} />} />
        <StatCard label={t('monthCollections')} value={<Money minorUnits={data.monthlyCollections} />} />
        <StatCard
          label={t('overdueBalance')}
          value={<Money minorUnits={data.overdueBalance} />}
          tone={data.overdueBalance > 0 ? 'destructive' : undefined}
        />
      </div>

      <div className="rounded-lg border p-4">
        <h2 className="mb-3 text-sm font-semibold">{t('overdueCustomers')}</h2>
        {data.overdueCustomers.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">{t('noOverdueCustomers')}</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('customer')}</TableHead>
                <TableHead>{t('phone')}</TableHead>
                <TableHead>{t('overdueInstallments')}</TableHead>
                <TableHead className="text-end">{t('overdueBalance')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.overdueCustomers.map((customer) => (
                <TableRow key={customer.customerId}>
                  <TableCell>
                    <Link href={routes.customer(customer.customerId)} className="font-medium hover:underline">
                      {customer.customerName}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{customer.customerPhone}</TableCell>
                  <TableCell>{customer.overdueInstallmentCount}</TableCell>
                  <TableCell className="text-end">
                    <Money minorUnits={customer.overdueBalance} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
