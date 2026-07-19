'use client';

import { Copy, MapPin, MessageCircle, Pencil, Phone, Plus, QrCode, StickyNote, UserRoundX } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { toast } from 'sonner';
import { CustomerFormDialog } from '@/components/customers/customer-form-dialog';
import { CustomerQrDialog } from '@/components/customers/customer-qr-dialog';
import { BackLink } from '@/components/shared/back-link';
import { DataTable, type Column } from '@/components/shared/data-table';
import { DateText } from '@/components/shared/date-text';
import { EmptyState } from '@/components/shared/empty-state';
import { InitialAvatar } from '@/components/shared/initial-avatar';
import { Money } from '@/components/shared/money';
import { FadeIn } from '@/components/shared/motion';
import { Section } from '@/components/shared/section';
import { StatusBadge } from '@/components/shared/status-badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Link } from '@/i18n/navigation';
import type { CustomerContractSummary } from '@/lib/api/customers';
import { useCustomer, useUpdateCustomer } from '@/hooks/use-customers';
import { normalizeLocalPhoneInput } from '@/lib/phone';
import { routes } from '@/lib/routes';

export default function CustomerDetailPage() {
  const t = useTranslations('customers.detail');
  const tNav = useTranslations('nav');
  const { id } = useParams<{ id: string }>();
  const { data: customer, isLoading, isError } = useCustomer(id);
  const updateCustomer = useUpdateCustomer(id);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-5 w-28" />
        <Skeleton className="h-28 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  if (isError || !customer) {
    return (
      <Section>
        <EmptyState icon={UserRoundX} title={t('notFound')} />
      </Section>
    );
  }

  const publicUrl = `${window.location.origin}${routes.publicCustomer(customer.publicId)}`;
  const whatsappUrl = `https://wa.me/20${normalizeLocalPhoneInput(customer.phone)}?text=${encodeURIComponent(publicUrl)}`;

  const columns: Column<CustomerContractSummary>[] = [
    {
      id: 'product',
      header: t('product'),
      role: 'primary',
      cell: (contract) => (
        <Link href={routes.contract(contract.id)} className="font-medium hover:underline">
          {contract.productName}
        </Link>
      ),
    },
    {
      id: 'total',
      header: t('total'),
      cell: (contract) => <Money minorUnits={contract.totalAmount} className="font-medium" />,
    },
    {
      id: 'status',
      header: t('status'),
      role: 'trailing',
      cell: (contract) => <StatusBadge status={contract.status} />,
    },
    {
      id: 'created',
      header: t('created'),
      cell: (contract) => (
        <span className="text-muted-foreground">
          <DateText value={contract.createdAt} />
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <FadeIn>
        <BackLink href={routes.customers} label={tNav('customers')} />
      </FadeIn>

      <FadeIn delay={0.05}>
        <div className="flex flex-col gap-5 rounded-xl border border-border bg-card p-5 shadow-xs sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div className="flex items-center gap-4">
            <InitialAvatar name={customer.name} className="size-14 text-lg" />
            <div className="min-w-0 space-y-1.5">
              <h1 className="font-heading text-xl font-semibold tracking-tight">{customer.name}</h1>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Phone className="size-3.5" />
                  <span dir="ltr" className="tabular-nums">
                    {customer.phone}
                  </span>
                </span>
                {customer.address && (
                  <span className="flex items-center gap-1.5">
                    <MapPin className="size-3.5" />
                    {customer.address}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                navigator.clipboard.writeText(publicUrl);
                toast.success(t('linkCopied'));
              }}
            >
              <Copy className="size-4" />
              {t('copyLink')}
            </Button>
            <CustomerQrDialog
              trigger={
                <Button variant="outline" size="sm">
                  <QrCode className="size-4" />
                  {t('qrCode')}
                </Button>
              }
              customerName={customer.name}
              publicUrl={publicUrl}
            />
            <Button
              variant="outline"
              size="sm"
              render={<a href={whatsappUrl} target="_blank" rel="noopener noreferrer" />}
            >
              <MessageCircle className="size-4" />
              {t('sendWhatsapp')}
            </Button>
            <CustomerFormDialog
              trigger={
                <Button variant="outline" size="sm">
                  <Pencil className="size-4" />
                  {t('edit')}
                </Button>
              }
              customer={customer}
              onSubmit={(input) => updateCustomer.mutateAsync(input)}
            />
            <Button size="sm" render={<Link href={`${routes.newContract}?customerId=${customer.id}`} />}>
              <Plus className="size-4" />
              {t('newContract')}
            </Button>
          </div>
        </div>
      </FadeIn>

      {customer.notes && (
        <FadeIn delay={0.08}>
          <div className="flex gap-3 rounded-xl border border-border bg-card p-5 shadow-xs">
            <StickyNote className="size-4 shrink-0 text-muted-foreground" />
            <p className="text-sm whitespace-pre-line text-muted-foreground">{customer.notes}</p>
          </div>
        </FadeIn>
      )}

      <FadeIn delay={0.1} className="space-y-3">
        <h2 className="font-heading text-sm font-semibold">{t('contracts')}</h2>
        {customer.contracts.length === 0 ? (
          <Section>
            <EmptyState
              icon={Plus}
              title={t('noContracts')}
              description={t('createContractPrompt')}
              action={
                <Button
                  size="sm"
                  render={<Link href={`${routes.newContract}?customerId=${customer.id}`} />}
                >
                  <Plus className="size-4" />
                  {t('newContract')}
                </Button>
              }
            />
          </Section>
        ) : (
          <DataTable
            columns={columns}
            rows={customer.contracts}
            keyOf={(contract) => contract.id}
            href={(contract) => routes.contract(contract.id)}
          />
        )}
      </FadeIn>
    </div>
  );
}
