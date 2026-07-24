'use client';

import { ReceiptText, Settings2 } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Column, DataTable } from '@/components/shared/data-table';
import { EmptyState } from '@/components/shared/empty-state';
import { FadeIn } from '@/components/shared/motion';
import { PageHeader } from '@/components/shared/page-header';
import { PaginationControls } from '@/components/shared/pagination-controls';
import { Section } from '@/components/shared/section';
import { TableSkeleton } from '@/components/shared/skeletons';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ClaimReviewDialog } from '@/components/payment-claims/claim-review-dialog';
import { Link } from '@/i18n/navigation';
import { usePaymentClaims } from '@/hooks/use-payment-claims';
import { PaymentClaimEntry, PaymentClaimStatus } from '@/lib/api/payment-claims';
import { formatDateTime } from '@/lib/format';
import { routes } from '@/lib/routes';

const STATUS_TABS: { value: PaymentClaimStatus | 'ALL'; labelKey: string }[] = [
  { value: 'PENDING', labelKey: 'tabPending' },
  { value: 'APPROVED', labelKey: 'tabApproved' },
  { value: 'DECLINED', labelKey: 'tabDeclined' },
  { value: 'ALL', labelKey: 'tabAll' },
];

const STATUS_BADGE_VARIANT: Record<PaymentClaimStatus, 'secondary' | 'default' | 'destructive'> = {
  PENDING: 'secondary',
  APPROVED: 'default',
  DECLINED: 'destructive',
};

const STATUS_LABEL_KEY: Record<PaymentClaimStatus, string> = {
  PENDING: 'statusPending',
  APPROVED: 'statusApproved',
  DECLINED: 'statusDeclined',
};

export default function PaymentClaimsPage() {
  const t = useTranslations('paymentClaims');
  const tCommon = useTranslations('common');
  const locale = useLocale();
  const [status, setStatus] = useState<PaymentClaimStatus | 'ALL'>('PENDING');
  const [page, setPage] = useState(1);
  const [activeClaim, setActiveClaim] = useState<PaymentClaimEntry | null>(null);

  const { data, isLoading, isError } = usePaymentClaims({
    status: status === 'ALL' ? undefined : status,
    page,
    limit: 20,
  });

  const columns: Column<PaymentClaimEntry>[] = [
    {
      id: 'customer',
      header: t('columnCustomer'),
      role: 'primary',
      cell: (claim) => <span className="font-medium">{claim.contract.customer.name}</span>,
    },
    {
      id: 'contract',
      header: t('columnContract'),
      cell: (claim) => (
        <span className="text-muted-foreground">
          {claim.installment ? `${claim.contract.productName} · #${claim.installment.sequence}` : claim.contract.productName}
        </span>
      ),
    },
    {
      id: 'method',
      header: t('columnMethod'),
      cell: (claim) => <span>{claim.paymentMethod.label}</span>,
    },
    {
      id: 'status',
      header: t('columnStatus'),
      role: 'trailing',
      cell: (claim) => (
        <Badge variant={STATUS_BADGE_VARIANT[claim.status]}>{t(STATUS_LABEL_KEY[claim.status])}</Badge>
      ),
    },
    {
      id: 'date',
      header: t('columnDate'),
      align: 'end',
      cell: (claim) => (
        <span className="text-muted-foreground tabular-nums">{formatDateTime(claim.createdAt, locale)}</span>
      ),
    },
    {
      id: 'review',
      header: '',
      headerHidden: true,
      role: 'action',
      align: 'end',
      cell: (claim) => (
        <Button type="button" size="sm" variant="outline" onClick={() => setActiveClaim(claim)}>
          {t('review')}
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <FadeIn>
        <PageHeader
          title={t('title')}
          description={t('subtitle')}
          actions={
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              aria-label={t('managePaymentMethods')}
              render={<Link href={`${routes.settings}?tab=paymentMethods`} />}
            >
              <Settings2 className="size-4" />
            </Button>
          }
        />
      </FadeIn>

      <FadeIn delay={0.05} className="space-y-4">
        <Tabs
          value={status}
          onValueChange={(value) => {
            setStatus(value as PaymentClaimStatus | 'ALL');
            setPage(1);
          }}
        >
          <div className="-mx-1 overflow-x-auto px-1">
            <TabsList className="min-w-fit">
              {STATUS_TABS.map((tab) => (
                <TabsTrigger key={tab.value} value={tab.value} className="shrink-0">
                  {t(tab.labelKey)}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>
        </Tabs>

        {isLoading ? (
          <TableSkeleton />
        ) : isError || !data ? (
          <Section>
            <EmptyState icon={ReceiptText} title={t('loadError')} description={tCommon('tryAgain')} />
          </Section>
        ) : data.data.length === 0 ? (
          <Section>
            <EmptyState icon={ReceiptText} title={t('empty')} />
          </Section>
        ) : (
          <div className="space-y-4">
            <DataTable columns={columns} rows={data.data} keyOf={(claim) => claim.id} />
            <PaginationControls page={data.page} totalPages={data.totalPages} onPageChange={setPage} />
          </div>
        )}
      </FadeIn>

      <ClaimReviewDialog claim={activeClaim} onOpenChange={(open) => !open && setActiveClaim(null)} />
    </div>
  );
}
