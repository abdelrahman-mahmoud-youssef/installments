'use client';

import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { EmptyState } from '@/components/shared/empty-state';
import { Money } from '@/components/shared/money';
import { PageHeader } from '@/components/shared/page-header';
import { StatCard } from '@/components/shared/stat-card';
import { StatusBadge } from '@/components/shared/status-badge';
import { RecordPaymentDialog } from '@/components/contracts/record-payment-dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Link } from '@/i18n/navigation';
import { useCancelContract, useContract } from '@/hooks/use-contracts';
import { useCreatePayment } from '@/hooks/use-payments';
import { ApiError } from '@/lib/api/client';
import { getDisplayInstallmentStatus } from '@/lib/enums';
import { formatDate } from '@/lib/format';
import { routes } from '@/lib/routes';

export default function ContractDetailPage() {
  const t = useTranslations('contracts.detail');
  const tCalculationMethod = useTranslations('calculationMethod');
  const tRecurrenceType = useTranslations('recurrenceType');
  const { id } = useParams<{ id: string }>();
  const { data: contract, isLoading, isError } = useContract(id);
  const createPayment = useCreatePayment(id);
  const cancelContract = useCancelContract(id);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-32" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (isError || !contract) {
    return <EmptyState title={t('notFound')} />;
  }

  const paidAmount = contract.installments.reduce((total, installment) => total + installment.paidAmount, 0);
  const remainingAmount = contract.totalAmount - paidAmount;
  const outstandingInstallments = contract.installments.filter(
    (installment) => installment.status === 'PENDING' || installment.status === 'PARTIALLY_PAID',
  );
  const upcomingInstallment = outstandingInstallments[0];
  const isActive = contract.status === 'ACTIVE';

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={contract.productName}
        description={
          <Link href={routes.customer(contract.customer.id)} className="hover:underline">
            {contract.customer.name} — {contract.customer.phone}
          </Link>
        }
        actions={
          isActive ? (
            <>
              <RecordPaymentDialog
                trigger={<Button>{t('recordPayment')}</Button>}
                outstandingInstallments={outstandingInstallments}
                onSubmit={(input) => createPayment.mutateAsync(input)}
              />
              <ConfirmDialog
                trigger={<Button variant="outline">{t('cancelContract')}</Button>}
                title={t('cancelTitle')}
                description={t('cancelDescription')}
                confirmLabel={t('cancelContract')}
                destructive
                onConfirm={async () => {
                  try {
                    await cancelContract.mutateAsync();
                    toast.success(t('cancelled'));
                  } catch (error) {
                    toast.error(error instanceof ApiError ? error.message : t('cancelError'));
                  }
                }}
              />
            </>
          ) : (
            <StatusBadge status={contract.status} />
          )
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label={t('totalAmount')} value={<Money minorUnits={contract.totalAmount} />} />
        <StatCard label={t('paid')} value={<Money minorUnits={paidAmount} />} />
        <StatCard label={t('remaining')} value={<Money minorUnits={remainingAmount} />} />
        <StatCard
          label={t('upcomingInstallment')}
          value={upcomingInstallment ? formatDate(upcomingInstallment.dueDate) : '—'}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t('contractDetails')}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-1 text-sm">
            <p>
              {t('productPrice')}: <Money minorUnits={contract.productPrice} />
            </p>
            <p>
              {t('downPayment')}: <Money minorUnits={contract.downPayment} />
            </p>
            <p>
              {t('calculationMethod')}: {tCalculationMethod(contract.calculationMethod)}
            </p>
            <p>
              {t('recurrence')}: {tRecurrenceType(contract.recurrenceType)}
            </p>
            <p>
              {t('installments')}: {contract.installmentCount}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">{t('status')}</CardTitle>
          </CardHeader>
          <CardContent>
            <StatusBadge status={contract.status} />
          </CardContent>
        </Card>
      </div>

      <div className="rounded-lg border p-4">
        <h2 className="mb-3 text-sm font-semibold">{t('schedule')}</h2>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('sequence')}</TableHead>
              <TableHead>{t('dueDate')}</TableHead>
              <TableHead>{t('amount')}</TableHead>
              <TableHead>{t('paidAmount')}</TableHead>
              <TableHead>{t('remainingAmount')}</TableHead>
              <TableHead>{t('status')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {contract.installments.map((installment) => (
              <TableRow key={installment.id}>
                <TableCell>{installment.sequence}</TableCell>
                <TableCell>{formatDate(installment.dueDate)}</TableCell>
                <TableCell>
                  <Money minorUnits={installment.amount} />
                </TableCell>
                <TableCell>
                  <Money minorUnits={installment.paidAmount} />
                </TableCell>
                <TableCell>
                  <Money minorUnits={installment.amount - installment.paidAmount} />
                </TableCell>
                <TableCell>
                  <StatusBadge
                    status={getDisplayInstallmentStatus(installment.status, installment.dueDate)}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="rounded-lg border p-4">
        <h2 className="mb-3 text-sm font-semibold">{t('paymentHistory')}</h2>
        {contract.payments.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">{t('noPayments')}</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('date')}</TableHead>
                <TableHead>{t('amount')}</TableHead>
                <TableHead>{t('note')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {contract.payments.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell>{formatDate(payment.paidAt)}</TableCell>
                  <TableCell>
                    <Money minorUnits={payment.amount} />
                  </TableCell>
                  <TableCell className="text-muted-foreground">{payment.note ?? '—'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
