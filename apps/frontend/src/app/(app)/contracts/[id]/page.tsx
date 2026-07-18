'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
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
import { useCancelContract, useContract } from '@/hooks/use-contracts';
import { useCreatePayment } from '@/hooks/use-payments';
import { ApiError } from '@/lib/api/client';
import { CALCULATION_METHOD_LABELS, getDisplayInstallmentStatus, RECURRENCE_TYPE_LABELS } from '@/lib/enums';
import { formatDate } from '@/lib/format';
import { routes } from '@/lib/routes';

export default function ContractDetailPage() {
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
    return <EmptyState title="Contract not found" />;
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
                trigger={<Button>Record payment</Button>}
                outstandingInstallments={outstandingInstallments}
                onSubmit={(input) => createPayment.mutateAsync(input)}
              />
              <ConfirmDialog
                trigger={<Button variant="outline">Cancel contract</Button>}
                title="Cancel this contract?"
                description="This cancels every remaining pending or partially paid installment. This cannot be undone."
                confirmLabel="Cancel contract"
                destructive
                onConfirm={async () => {
                  try {
                    await cancelContract.mutateAsync();
                    toast.success('Contract cancelled.');
                  } catch (error) {
                    toast.error(error instanceof ApiError ? error.message : 'Could not cancel contract.');
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
        <StatCard label="Total amount" value={<Money minorUnits={contract.totalAmount} />} />
        <StatCard label="Paid" value={<Money minorUnits={paidAmount} />} />
        <StatCard label="Remaining" value={<Money minorUnits={remainingAmount} />} />
        <StatCard
          label="Upcoming installment"
          value={upcomingInstallment ? formatDate(upcomingInstallment.dueDate) : '—'}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Contract details</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-1 text-sm">
            <p>
              Product price: <Money minorUnits={contract.productPrice} />
            </p>
            <p>
              Down payment: <Money minorUnits={contract.downPayment} />
            </p>
            <p>Calculation method: {CALCULATION_METHOD_LABELS[contract.calculationMethod]}</p>
            <p>Recurrence: {RECURRENCE_TYPE_LABELS[contract.recurrenceType]}</p>
            <p>Installments: {contract.installmentCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Status</CardTitle>
          </CardHeader>
          <CardContent>
            <StatusBadge status={contract.status} />
          </CardContent>
        </Card>
      </div>

      <div className="rounded-lg border p-4">
        <h2 className="mb-3 text-sm font-semibold">Installment schedule</h2>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>#</TableHead>
              <TableHead>Due date</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Paid</TableHead>
              <TableHead>Remaining</TableHead>
              <TableHead>Status</TableHead>
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
        <h2 className="mb-3 text-sm font-semibold">Payment history</h2>
        {contract.payments.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">No payments recorded yet.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Note</TableHead>
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
