'use client';

import { ArrowDownCircle, ArrowUpCircle, FileWarning, Pencil, Plus, Receipt, SearchX, Trash2, Wallet } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { LogTransactionDialog } from '@/components/payment-methods/log-transaction-dialog';
import { PaymentMethodFormDialog } from '@/components/payment-methods/payment-method-form-dialog';
import { BackLink } from '@/components/shared/back-link';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { DateText } from '@/components/shared/date-text';
import { EmptyState } from '@/components/shared/empty-state';
import { ImagePreviewDialog } from '@/components/shared/image-preview-dialog';
import { MetricCard } from '@/components/shared/metric-card';
import { Money } from '@/components/shared/money';
import { FadeIn } from '@/components/shared/motion';
import { MonthSwitcher } from '@/components/shared/month-switcher';
import { PageHeader } from '@/components/shared/page-header';
import { PaginationControls } from '@/components/shared/pagination-controls';
import { PaymentMethodIcon } from '@/components/shared/payment-method-icon';
import { SearchInput } from '@/components/shared/search-input';
import { Section } from '@/components/shared/section';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { usePaymentMethodMonthlySummary, usePaymentMethodTransactions } from '@/hooks/use-payment-method-transactions';
import { useDeletePaymentMethod, usePaymentMethods, useUpdatePaymentMethod } from '@/hooks/use-payment-methods';
import { useRouter } from '@/i18n/navigation';
import { ApiError } from '@/lib/api/client';
import { resolveAssetUrl } from '@/lib/assets';
import { currentMonthKey } from '@/lib/format';
import { routes } from '@/lib/routes';

export default function PaymentMethodDetailPage() {
  const t = useTranslations('paymentMethods');
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [month, setMonth] = useState(currentMonthKey());
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, 300);

  const { data: paymentMethods, isLoading: isLoadingMethods } = usePaymentMethods();
  const method = paymentMethods?.find((item) => item.id === id);
  const { data: summary, isLoading: isLoadingSummary } = usePaymentMethodMonthlySummary(id, month);
  const { data: transactions, isLoading: isLoadingTransactions } = usePaymentMethodTransactions(id, {
    month,
    page,
    limit: 20,
    q: debouncedSearch || undefined,
  });

  const updatePaymentMethod = useUpdatePaymentMethod();
  const deletePaymentMethod = useDeletePaymentMethod();

  async function handleToggleActive(next: boolean) {
    try {
      await updatePaymentMethod.mutateAsync({ id, input: { isActive: next } });
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : t('genericError'));
    }
  }

  async function handleDelete() {
    try {
      await deletePaymentMethod.mutateAsync(id);
      toast.success(t('paymentMethodDeleted'));
      router.push(routes.paymentMethods);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : t('genericError'));
    }
  }

  if (isLoadingMethods) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-5 w-28" />
        <Skeleton className="h-28 rounded-xl" />
        <Skeleton className="h-40 rounded-xl" />
      </div>
    );
  }

  if (!method) {
    return (
      <Section>
        <EmptyState icon={FileWarning} title={t('notFound')} />
      </Section>
    );
  }

  return (
    <div className="space-y-6">
      <FadeIn>
        <BackLink href={routes.paymentMethods} label={t('title')} />
      </FadeIn>

      <FadeIn delay={0.04}>
        <PageHeader
          title={method.label}
          description={
            <span dir="ltr" className="inline-block">
              {method.details}
            </span>
          }
          actions={
            <>
              <Switch
                checked={method.isActive}
                onCheckedChange={handleToggleActive}
                disabled={updatePaymentMethod.isPending}
                aria-label={t('paymentMethodActive')}
              />
              <PaymentMethodFormDialog
                method={method}
                defaultLabel={method.label}
                trigger={
                  <Button type="button" variant="outline" size="sm">
                    <Pencil className="size-4" />
                    {t('editPaymentMethod')}
                  </Button>
                }
              />
              <ConfirmDialog
                trigger={
                  <Button type="button" variant="outline" size="sm">
                    <Trash2 className="size-4" />
                    {t('delete')}
                  </Button>
                }
                title={t('deletePaymentMethodTitle')}
                description={t('deletePaymentMethodDescription', { label: method.label })}
                confirmLabel={t('delete')}
                destructive
                onConfirm={handleDelete}
              />
            </>
          }
        />
      </FadeIn>

      <FadeIn delay={0.08} className="flex items-center gap-3">
        <PaymentMethodIcon presetKey={method.presetKey} className="size-9" />
        <MonthSwitcher month={month} onChange={setMonth} />
      </FadeIn>

      {isLoadingSummary ? (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-28 w-full" />
          ))}
        </div>
      ) : summary ? (
        <FadeIn delay={0.1} className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <MetricCard label={t('received')} value={<Money minorUnits={summary.paymentTotal + summary.receivedTotal} />} icon={ArrowDownCircle} tone="success" />
          <MetricCard label={t('sent')} value={<Money minorUnits={summary.sentTotal} />} icon={ArrowUpCircle} tone="danger" />
          {summary.monthlyLimit != null ? (
            <>
              <MetricCard label={t('monthlyLimitLabel')} value={<Money minorUnits={summary.monthlyLimit} />} icon={Wallet} tone="neutral" />
              <MetricCard
                label={t('remaining')}
                value={<Money minorUnits={Math.max(summary.monthlyLimit - summary.total, 0)} />}
                icon={Wallet}
                tone={summary.total / summary.monthlyLimit >= 0.8 ? 'danger' : 'primary'}
                emphasis
              />
            </>
          ) : (
            <MetricCard label={t('noLimitSet')} value="—" icon={Wallet} tone="neutral" />
          )}
        </FadeIn>
      ) : null}

      <FadeIn delay={0.14} className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-heading text-sm font-semibold">{t('transactionHistory')}</h2>
          <LogTransactionDialog
            paymentMethodId={id}
            trigger={
              <Button size="sm">
                <Plus className="size-4" />
                {t('logTransaction')}
              </Button>
            }
          />
        </div>

        <SearchInput
          value={search}
          onChange={(value) => {
            setSearch(value);
            setPage(1);
          }}
          placeholder={t('transactionSearchPlaceholder')}
          className="max-w-sm"
        />

        {debouncedSearch && transactions && (
          <div className="flex flex-wrap items-center gap-4 rounded-lg border border-border bg-muted/30 px-4 py-2.5 text-sm">
            <span className="flex items-center gap-1.5 text-success">
              <ArrowDownCircle className="size-4" />
              {t('received')}
              <Money minorUnits={transactions.totalIn} className="font-semibold" />
            </span>
            <span className="flex items-center gap-1.5 text-danger">
              <ArrowUpCircle className="size-4" />
              {t('sent')}
              <Money minorUnits={transactions.totalOut} className="font-semibold" />
            </span>
          </div>
        )}

        {isLoadingTransactions ? (
          <Skeleton className="h-40 w-full" />
        ) : !transactions || transactions.data.length === 0 ? (
          <Section>
            <EmptyState
              icon={debouncedSearch ? SearchX : Receipt}
              title={debouncedSearch ? t('noTransactionsFound') : t('noTransactionsYet')}
              compact
            />
          </Section>
        ) : (
          <Section>
            <div className="space-y-1">
              {transactions.data.map((transaction) => (
                <div key={transaction.id} className="flex items-center gap-3 py-2">
                  <span
                    className={
                      transaction.direction === 'OUT'
                        ? 'grid size-9 shrink-0 place-items-center rounded-full bg-danger-soft text-danger'
                        : 'grid size-9 shrink-0 place-items-center rounded-full bg-success-soft text-success'
                    }
                  >
                    {transaction.direction === 'OUT' ? (
                      <ArrowUpCircle className="size-4" />
                    ) : (
                      <ArrowDownCircle className="size-4" />
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">
                      <DateText value={transaction.occurredAt} />
                      {transaction.counterpartyName && (
                        <span className="text-muted-foreground">
                          {' · '}
                          {transaction.direction === 'OUT' ? t('counterpartyNameTo') : t('counterpartyNameFrom')}{' '}
                          {transaction.counterpartyName}
                        </span>
                      )}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {[transaction.counterpartyPhone, transaction.note].filter(Boolean).join(' · ')}
                    </p>
                  </div>
                  {transaction.receiptUrl && (
                    <ImagePreviewDialog
                      src={resolveAssetUrl(transaction.receiptUrl) ?? ''}
                      alt={t('transactionReceipt')}
                      trigger={
                        <button
                          type="button"
                          title={t('viewReceipt')}
                          className="size-9 shrink-0 overflow-hidden rounded-lg border border-border transition-transform hover:scale-105 hover:border-primary"
                        >
                          <img
                            src={resolveAssetUrl(transaction.receiptUrl) ?? ''}
                            alt={t('transactionReceipt')}
                            className="size-full object-cover"
                          />
                        </button>
                      }
                    />
                  )}
                  <Money
                    minorUnits={transaction.amount}
                    className={
                      transaction.direction === 'OUT'
                        ? 'text-sm font-semibold text-danger'
                        : 'text-sm font-semibold text-success'
                    }
                  />
                </div>
              ))}
            </div>
            <PaginationControls page={page} totalPages={transactions.totalPages} onPageChange={setPage} />
          </Section>
        )}
      </FadeIn>
    </div>
  );
}
