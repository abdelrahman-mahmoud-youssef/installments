'use client';

import Link from 'next/link';
import { EmptyState } from '@/components/shared/empty-state';
import { Money } from '@/components/shared/money';
import { PageHeader } from '@/components/shared/page-header';
import { StatCard } from '@/components/shared/stat-card';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useReports } from '@/hooks/use-reports';
import { routes } from '@/lib/routes';

export default function ReportsPage() {
  const { data, isLoading, isError } = useReports();

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title="Reports" />
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
        <PageHeader title="Reports" />
        <EmptyState title="Couldn't load reports" description="Please try again in a moment." />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Reports" />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Today's collections" value={<Money minorUnits={data.todayCollections} />} />
        <StatCard label="This month's collections" value={<Money minorUnits={data.monthlyCollections} />} />
        <StatCard
          label="Overdue balance"
          value={<Money minorUnits={data.overdueBalance} />}
          tone={data.overdueBalance > 0 ? 'destructive' : undefined}
        />
      </div>

      <div className="rounded-lg border p-4">
        <h2 className="mb-3 text-sm font-semibold">Overdue customers</h2>
        {data.overdueCustomers.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">No overdue customers.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Overdue installments</TableHead>
                <TableHead className="text-right">Overdue balance</TableHead>
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
                  <TableCell className="text-right">
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
