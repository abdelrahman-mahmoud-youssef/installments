'use client';

import { CalendarClock, FileWarning, Receipt, XCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { toast } from 'sonner';
import { RecordPaymentDialog } from '@/components/contracts/record-payment-dialog';
import { BackLink } from '@/components/shared/back-link';
import { CollectionProgress } from '@/components/shared/collection-progress';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { DataTable, type Column } from '@/components/shared/data-table';
import { DateText } from '@/components/shared/date-text';
import { EmptyState } from '@/components/shared/empty-state';
import { Money } from '@/components/shared/money';
import { FadeIn } from '@/components/shared/motion';
import { ProgressRing } from '@/components/shared/progress-ring';
import { Section } from '@/components/shared/section';
import { StatusBadge } from '@/components/shared/status-badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Link } from '@/i18n/navigation';
import type { Installment } from '@/lib/api/contracts';
import { useCancelContract, useContract } from '@/hooks/use-contracts';
import { useCreatePayment } from '@/hooks/use-payments';
import { ApiError } from '@/lib/api/client';
import { getDisplayInstallmentStatus } from '@/lib/enums';
import { routes } from '@/lib/routes';

function HeroStat({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-heading text-lg font-semibold tracking-tight tabular-nums">{children}</p>
    </div>
  );
}

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2.5">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="text-sm font-medium tabular-nums">{children}</dd>
    </div>
  );
}

export default function ContractDetailPage() {
  const t = useTranslations('contracts.detail');
  const tNav = useTranslations('nav');
  const tCalculationMethod = useTranslations('calculationMethod');
  const tRecurrenceType = useTranslations('recurrenceType');
  const { id } = useParams<{ id: string }>();
  const { data: contract, isLoading, isError } = useContract(id);
  const createPayment = useCreatePayment(id);
  const cancelContract = useCancelContract(id);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-5 w-28" />
        <Skeleton className="h-40 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  if (isError || !contract) {
    return (
      <Section>
        <EmptyState icon={FileWarning} title={t('notFound')} />
      </Section>
    );
  }

  const installmentsTotal = contract.installments.reduce((sum, item) => sum + item.amount, 0);
  const paidAmount = contract.installments.reduce((sum, item) => sum + item.paidAmount, 0);
  const remainingAmount = installmentsTotal - paidAmount;
  const paidCount = contract.installments.filter((item) => item.status === 'PAID').length;
  const outstandingInstallments = contract.installments.filter(
    (item) => item.status === 'PENDING' || item.status === 'PARTIALLY_PAID',
  );
  const upcomingInstallment = outstandingInstallments[0];
  const ratio = installmentsTotal > 0 ? paidAmount / installmentsTotal : 0;
  const isActive = contract.status === 'ACTIVE';

  const scheduleColumns: Column<Installment>[] = [
    {
      id: 'seq',
      header: t('sequence'),
      className: 'w-12',
      cell: (item) => <span className="text-muted-foreground tabular-nums">{item.sequence}</span>,
    },
    {
      id: 'due',
      header: t('dueDate'),
      role: 'primary',
      cell: (item) => (
        <span className="font-medium">
          <DateText value={item.dueDate} />
        </span>
      ),
    },
    {
      id: 'amount',
      header: t('amount'),
      align: 'end',
      cell: (item) => <Money minorUnits={item.amount} />,
    },
    {
      id: 'paid',
      header: t('paidAmount'),
      align: 'end',
      cell: (item) => <Money minorUnits={item.paidAmount} className="text-muted-foreground" />,
    },
    {
      id: 'remaining',
      header: t('remainingAmount'),
      align: 'end',
      cell: (item) => <Money minorUnits={item.amount - item.paidAmount} className="font-medium" />,
    },
    {
      id: 'status',
      header: t('status'),
      role: 'trailing',
      align: 'end',
      cell: (item) => <StatusBadge status={getDisplayInstallmentStatus(item.status, item.dueDate)} />,
    },
  ];

  return (
    <div className="space-y-6">
      <FadeIn>
        <BackLink href={routes.contracts} label={tNav('contracts')} />
      </FadeIn>

      <FadeIn delay={0.04}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 space-y-1.5">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="font-heading text-2xl font-semibold tracking-tight">{contract.productName}</h1>
              <StatusBadge status={contract.status} />
            </div>
            <Link
              href={routes.customer(contract.customer.id)}
              className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {contract.customer.name}
              <span className="text-border">·</span>
              <span dir="ltr" className="tabular-nums">
                {contract.customer.phone}
              </span>
            </Link>
          </div>
          {isActive && (
            <div className="flex flex-wrap items-center gap-2">
              <RecordPaymentDialog
                trigger={
                  <Button>
                    <Receipt className="size-4" />
                    {t('recordPayment')}
                  </Button>
                }
                outstandingInstallments={outstandingInstallments}
                onSubmit={(input) => createPayment.mutateAsync(input)}
              />
              <ConfirmDialog
                trigger={
                  <Button variant="outline">
                    <XCircle className="size-4" />
                    {t('cancelContract')}
                  </Button>
                }
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
            </div>
          )}
        </div>
      </FadeIn>

      <FadeIn delay={0.08}>
        <div className="rounded-xl border border-border bg-card p-6 shadow-xs">
          <div className="grid items-center gap-6 sm:grid-cols-[auto_1fr]">
            <div className="mx-auto sm:mx-0">
              <ProgressRing value={ratio} size={132} stroke={11}>
                <div>
                  <p className="font-heading text-2xl font-semibold tabular-nums">
                    {Math.round(ratio * 100)}%
                  </p>
                  <p className="text-xs text-muted-foreground">{t('collected')}</p>
                </div>
              </ProgressRing>
            </div>
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <HeroStat label={t('paid')}>
                  <Money minorUnits={paidAmount} className="text-success" />
                </HeroStat>
                <HeroStat label={t('remaining')}>
                  <Money minorUnits={remainingAmount} />
                </HeroStat>
                <HeroStat label={t('totalAmount')}>
                  <Money minorUnits={contract.totalAmount} />
                </HeroStat>
                <HeroStat label={t('upcomingInstallment')}>
                  {upcomingInstallment ? <DateText value={upcomingInstallment.dueDate} /> : '—'}
                </HeroStat>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{t('scheduleProgress')}</span>
                  <span className="tabular-nums">
                    {paidCount}/{contract.installments.length}
                  </span>
                </div>
                <CollectionProgress installments={contract.installments} size="lg" />
              </div>
            </div>
          </div>
        </div>
      </FadeIn>

      <div className="grid gap-6 lg:grid-cols-3">
        <FadeIn delay={0.1} className="lg:col-span-1">
          <Section title={t('contractDetails')}>
            <dl className="divide-y divide-border">
              <DetailRow label={t('productPrice')}>
                <Money minorUnits={contract.productPrice} />
              </DetailRow>
              {contract.downPayment > 0 && (
                <DetailRow label={t('downPayment')}>
                  <Money minorUnits={contract.downPayment} />
                </DetailRow>
              )}
              <DetailRow label={t('calculationMethod')}>
                {tCalculationMethod(contract.calculationMethod)}
              </DetailRow>
              <DetailRow label={t('recurrence')}>{tRecurrenceType(contract.recurrenceType)}</DetailRow>
              <DetailRow label={t('installments')}>{contract.installmentCount}</DetailRow>
            </dl>
          </Section>
        </FadeIn>

        <FadeIn delay={0.12} className="space-y-3 lg:col-span-2">
          <h2 className="font-heading text-sm font-semibold">{t('schedule')}</h2>
          <DataTable columns={scheduleColumns} rows={contract.installments} keyOf={(item) => item.id} />
        </FadeIn>
      </div>

      <FadeIn delay={0.14}>
        <Section title={t('paymentHistory')}>
          {contract.payments.length === 0 ? (
            <EmptyState icon={CalendarClock} title={t('noPayments')} compact />
          ) : (
            <div className="space-y-1">
              {contract.payments.map((payment) => (
                <div key={payment.id} className="flex items-center gap-3 py-2">
                  <span className="grid size-9 shrink-0 place-items-center rounded-full bg-success-soft text-success">
                    <Receipt className="size-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">
                      <DateText value={payment.paidAt} />
                    </p>
                    {payment.note && (
                      <p className="truncate text-xs text-muted-foreground">{payment.note}</p>
                    )}
                  </div>
                  <Money minorUnits={payment.amount} className="text-sm font-semibold text-success" />
                </div>
              ))}
            </div>
          )}
        </Section>
      </FadeIn>
    </div>
  );
}
