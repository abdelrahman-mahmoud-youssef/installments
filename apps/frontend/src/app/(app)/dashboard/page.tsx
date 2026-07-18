'use client';

import Link from 'next/link';
import { DashboardInstallmentSummary } from '@/lib/api/dashboard';
import { Money } from '@/components/shared/money';
import { PageHeader } from '@/components/shared/page-header';
import { StatCard } from '@/components/shared/stat-card';
import { EmptyState } from '@/components/shared/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useDashboard } from '@/hooks/use-dashboard';
import { formatDate } from '@/lib/format';
import { routes } from '@/lib/routes';

function InstallmentsTable({
  installments,
  emptyMessage,
}: {
  installments: DashboardInstallmentSummary[];
  emptyMessage: string;
}) {
  if (installments.length === 0) {
    return <p className="py-6 text-center text-sm text-muted-foreground">{emptyMessage}</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Customer</TableHead>
          <TableHead>Product</TableHead>
          <TableHead>Due date</TableHead>
          <TableHead className="text-right">Remaining</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {installments.map((installment) => (
          <TableRow key={installment.id}>
            <TableCell>
              <Link href={routes.customer(installment.customerId)} className="hover:underline">
                {installment.customerName}
              </Link>
            </TableCell>
            <TableCell className="text-muted-foreground">{installment.productName}</TableCell>
            <TableCell>{formatDate(installment.dueDate)}</TableCell>
            <TableCell className="text-right">
              <Money minorUnits={installment.amount - installment.paidAmount} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export default function DashboardPage() {
  const { data, isLoading, isError } = useDashboard();

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title="Dashboard" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
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
        <PageHeader title="Dashboard" />
        <EmptyState title="Couldn't load the dashboard" description="Please try again in a moment." />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Dashboard" />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Due today" value={data.dueToday.length} />
        <StatCard label="Overdue" value={data.overdue.length} tone={data.overdue.length > 0 ? 'destructive' : undefined} />
        <StatCard label="Due within 7 days" value={data.dueNext7Days.length} />
        <StatCard label="Expected today" value={<Money minorUnits={data.totalExpectedToday} />} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-lg border p-4">
          <h2 className="mb-3 text-sm font-semibold">Due today</h2>
          <InstallmentsTable installments={data.dueToday} emptyMessage="Nothing due today." />
        </div>
        <div className="rounded-lg border p-4">
          <h2 className="mb-3 text-sm font-semibold">Overdue</h2>
          <InstallmentsTable installments={data.overdue} emptyMessage="No overdue installments." />
        </div>
      </div>

      <div className="rounded-lg border p-4">
        <h2 className="mb-3 text-sm font-semibold">Recent payments</h2>
        {data.recentPayments.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">No payments recorded yet.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.recentPayments.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell>
                    <Link href={routes.contract(payment.contractId)} className="hover:underline">
                      {payment.customerName}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{formatDate(payment.paidAt)}</TableCell>
                  <TableCell className="text-right">
                    <Money minorUnits={payment.amount} />
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
