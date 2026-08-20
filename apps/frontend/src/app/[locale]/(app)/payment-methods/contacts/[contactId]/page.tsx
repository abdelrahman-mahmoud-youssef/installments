'use client';

import { ArrowDownCircle, ArrowUpCircle, FileWarning, Pencil, Plus, Scale, SearchX, Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { AddAdjustmentDialog } from '@/components/payment-methods/add-adjustment-dialog';
import { ContactFormDialog } from '@/components/payment-methods/contact-form-dialog';
import { ContactStatementShareButton } from '@/components/payment-methods/contact-statement-share-button';
import { LogTransactionDialog } from '@/components/payment-methods/log-transaction-dialog';
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
import { Section } from '@/components/shared/section';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useCounterparty, useCounterpartyHistory, useDeleteCounterparty, useUpdateCounterparty } from '@/hooks/use-counterparties';
import { useRouter } from '@/i18n/navigation';
import { ApiError } from '@/lib/api/client';
import { resolveAssetUrl } from '@/lib/assets';
import { currentMonthKey } from '@/lib/format';
import { routes } from '@/lib/routes';

export default function ContactDetailPage() {
  const t = useTranslations('contacts.detail');
  const tList = useTranslations('contacts');
  const { contactId } = useParams<{ contactId: string }>();
  const router = useRouter();
  const [month, setMonth] = useState(currentMonthKey());
  const [page, setPage] = useState(1);

  const { data: contact, isLoading: isLoadingContact } = useCounterparty(contactId);
  const { data: history, isLoading: isLoadingHistory } = useCounterpartyHistory(contactId, { month, page, limit: 20 });
  const updateContact = useUpdateCounterparty(contactId);
  const deleteContact = useDeleteCounterparty();

  async function handleDelete() {
    try {
      await deleteContact.mutateAsync(contactId);
      toast.success(tList('deleted'));
      router.push(routes.contacts);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : tList('deleteError'));
    }
  }

  if (isLoadingContact) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-5 w-28" />
        <Skeleton className="h-28 rounded-xl" />
        <Skeleton className="h-40 rounded-xl" />
      </div>
    );
  }

  if (!contact) {
    return (
      <Section>
        <EmptyState icon={FileWarning} title={t('notFound')} />
      </Section>
    );
  }

  const balanceTone = contact.balance > 0 ? 'danger' : contact.balance < 0 ? 'success' : 'neutral';
  const balanceHint = contact.balance > 0 ? t('theyOwe') : contact.balance < 0 ? t('youOwe') : t('settled');

  return (
    <div className="space-y-6">
      <FadeIn>
        <BackLink href={routes.contacts} label={tList('title')} />
      </FadeIn>

      <FadeIn delay={0.04}>
        <PageHeader
          title={contact.name}
          description={contact.phone ?? undefined}
          actions={
            <>
              <ContactStatementShareButton contact={contact} />
              <ContactFormDialog
                contact={contact}
                trigger={
                  <Button type="button" variant="outline" size="sm">
                    <Pencil className="size-4" />
                    {t('edit')}
                  </Button>
                }
                onSubmit={(input) => updateContact.mutateAsync(input)}
              />
              <ConfirmDialog
                trigger={
                  <Button type="button" variant="outline" size="sm">
                    <Trash2 className="size-4" />
                    {tList('delete')}
                  </Button>
                }
                title={tList('deleteTitle')}
                description={tList('deleteDescription', { name: contact.name })}
                confirmLabel={tList('delete')}
                destructive
                onConfirm={handleDelete}
              />
            </>
          }
        />
      </FadeIn>

      <FadeIn delay={0.08}>
        <MonthSwitcher month={month} onChange={setMonth} />
      </FadeIn>

      <FadeIn delay={0.1} className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <MetricCard label={t('balanceLabel')} value={<Money minorUnits={Math.abs(contact.balance)} />} icon={Scale} tone={balanceTone} hint={balanceHint} emphasis />
        <MetricCard label={t('received')} value={<Money minorUnits={history?.totalIn ?? 0} />} icon={ArrowDownCircle} tone="success" />
        <MetricCard label={t('sent')} value={<Money minorUnits={history?.totalOut ?? 0} />} icon={ArrowUpCircle} tone="danger" />
      </FadeIn>

      <FadeIn delay={0.14} className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-heading text-sm font-semibold">{t('history')}</h2>
          <div className="flex items-center gap-2">
            <AddAdjustmentDialog
              counterpartyId={contactId}
              currentBalance={contact.balance}
              trigger={
                <Button size="sm" variant="outline">
                  <Scale className="size-4" />
                  {t('addAdjustment')}
                </Button>
              }
            />
            <LogTransactionDialog
              counterparty={{ id: contact.id, name: contact.name, phone: contact.phone }}
              trigger={
                <Button size="sm">
                  <Plus className="size-4" />
                  {t('logTransaction')}
                </Button>
              }
            />
          </div>
        </div>

        {isLoadingHistory ? (
          <Skeleton className="h-40 w-full" />
        ) : !history || history.data.length === 0 ? (
          <Section>
            <EmptyState icon={SearchX} title={t('noHistoryYet')} compact />
          </Section>
        ) : (
          <Section>
            <div className="space-y-1">
              {history.data.map((item) => (
                <div key={`${item.kind}-${item.id}`} className="flex items-center gap-3 py-2">
                  <span
                    className={
                      item.direction === 'OUT'
                        ? 'grid size-9 shrink-0 place-items-center rounded-full bg-danger-soft text-danger'
                        : 'grid size-9 shrink-0 place-items-center rounded-full bg-success-soft text-success'
                    }
                  >
                    {item.direction === 'OUT' ? <ArrowUpCircle className="size-4" /> : <ArrowDownCircle className="size-4" />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">
                      <DateText value={item.occurredAt} />
                      {item.kind === 'ADJUSTMENT' && (
                        <span className="ms-2 rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                          {t('adjustmentTag')}
                        </span>
                      )}
                      {item.paymentMethodLabel && <span className="text-muted-foreground"> · {item.paymentMethodLabel}</span>}
                    </p>
                    {item.note && <p className="truncate text-xs text-muted-foreground">{item.note}</p>}
                  </div>
                  {item.receiptUrl && (
                    <ImagePreviewDialog
                      src={resolveAssetUrl(item.receiptUrl) ?? ''}
                      alt={t('viewReceipt')}
                      trigger={
                        <button
                          type="button"
                          title={t('viewReceipt')}
                          className="size-9 shrink-0 overflow-hidden rounded-lg border border-border transition-transform hover:scale-105 hover:border-primary"
                        >
                          <img src={resolveAssetUrl(item.receiptUrl) ?? ''} alt={t('viewReceipt')} className="size-full object-cover" />
                        </button>
                      }
                    />
                  )}
                  <Money
                    minorUnits={item.amount}
                    className={item.direction === 'OUT' ? 'text-sm font-semibold text-danger' : 'text-sm font-semibold text-success'}
                  />
                </div>
              ))}
            </div>
            <PaginationControls page={page} totalPages={history.totalPages} onPageChange={setPage} />
          </Section>
        )}
      </FadeIn>
    </div>
  );
}
