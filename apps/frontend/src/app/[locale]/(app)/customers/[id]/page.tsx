'use client';

import {
  Copy,
  History,
  IdCard,
  MapPin,
  MoreVertical,
  Pencil,
  Phone,
  Plus,
  QrCode,
  StickyNote,
  UserRoundX,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import { FaWhatsapp } from 'react-icons/fa6';
import { toast } from 'sonner';
import { CustomerFormDialog } from '@/components/customers/customer-form-dialog';
import { CustomerNotificationHistoryDialog } from '@/components/customers/customer-notification-history-dialog';
import { CustomerQrDialog } from '@/components/customers/customer-qr-dialog';
import { BackLink } from '@/components/shared/back-link';
import { DataTable, type Column } from '@/components/shared/data-table';
import { DateText } from '@/components/shared/date-text';
import { EmptyState } from '@/components/shared/empty-state';
import { ImagePreviewDialog } from '@/components/shared/image-preview-dialog';
import { InitialAvatar } from '@/components/shared/initial-avatar';
import { Money } from '@/components/shared/money';
import { FadeIn } from '@/components/shared/motion';
import { Section } from '@/components/shared/section';
import { StatusBadge } from '@/components/shared/status-badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { Link } from '@/i18n/navigation';
import type { CustomerContractSummary } from '@/lib/api/customers';
import { useBranding } from '@/hooks/use-branding';
import { useCustomer, useUpdateCustomer } from '@/hooks/use-customers';
import { resolveAssetUrl } from '@/lib/assets';
import { normalizeLocalPhoneInput } from '@/lib/phone';
import { getSubdomainUrl } from '@/lib/root-domain';
import { routes } from '@/lib/routes';

export default function CustomerDetailPage() {
  const t = useTranslations('customers.detail');
  const tNav = useTranslations('nav');
  const { id } = useParams<{ id: string }>();
  const { data: customer, isLoading, isError } = useCustomer(id);
  const { data: branding } = useBranding();
  const updateCustomer = useUpdateCustomer(id);
  const [qrOpen, setQrOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);

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

  const customerPath = routes.publicCustomer(customer.publicId);
  const publicUrl = branding ? getSubdomainUrl(branding.slug, customerPath) : `${window.location.origin}${customerPath}`;
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
        <div className="rounded-xl border border-border bg-card p-5 shadow-xs sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex min-w-0 items-center gap-4">
              <InitialAvatar name={customer.name} className="size-14 shrink-0 text-lg" />
              <h1 className="truncate font-heading text-xl font-semibold tracking-tight">{customer.name}</h1>
            </div>
            <div className="flex shrink-0 flex-wrap items-center gap-2">
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
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <Button variant="outline" size="icon-sm" aria-label={t('moreActions')}>
                      <MoreVertical className="size-4" />
                    </Button>
                  }
                />
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem
                    onClick={() => {
                      navigator.clipboard.writeText(publicUrl);
                      toast.success(t('linkCopied'));
                    }}
                  >
                    <Copy className="size-4" />
                    {t('copyLink')}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setQrOpen(true)}>
                    <QrCode className="size-4" />
                    {t('qrCode')}
                  </DropdownMenuItem>
                  <DropdownMenuItem render={<a href={whatsappUrl} target="_blank" rel="noopener noreferrer" />}>
                    <FaWhatsapp className="size-4" />
                    {t('sendWhatsapp')}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setHistoryOpen(true)}>
                    <History className="size-4" />
                    {t('history')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-border pt-4 text-sm text-muted-foreground">
            <a
              href={`tel:${customer.phone}`}
              title={t('call')}
              className="flex items-center gap-1.5 hover:text-foreground hover:underline"
            >
              <Phone className="size-3.5" />
              <span dir="ltr" className="tabular-nums">
                {customer.phone}
              </span>
            </a>
            <a
              href={`https://wa.me/20${normalizeLocalPhoneInput(customer.phone)}`}
              target="_blank"
              rel="noopener noreferrer"
              title={t('openWhatsapp')}
              className="flex items-center gap-1.5 hover:text-foreground hover:underline"
            >
              <FaWhatsapp className="size-3.5" />
              {t('openWhatsapp')}
            </a>
            {customer.address && (
              <span className="flex items-center gap-1.5">
                <MapPin className="size-3.5" />
                {customer.address}
              </span>
            )}
          </div>

          {(customer.idImageFrontUrl || customer.idImageBackUrl) && (
            <div className="mt-3 flex items-center gap-2 border-t border-border pt-3">
              <IdCard className="size-3.5 shrink-0 text-muted-foreground" />
              {customer.idImageFrontUrl && (
                <ImagePreviewDialog
                  src={resolveAssetUrl(customer.idImageFrontUrl) ?? ''}
                  alt={t('viewIdImageFront')}
                  trigger={
                    <button
                      type="button"
                      title={t('viewIdImageFront')}
                      className="overflow-hidden rounded-md border border-border transition-opacity hover:opacity-80"
                    >
                      <img
                        src={resolveAssetUrl(customer.idImageFrontUrl) ?? undefined}
                        alt=""
                        className="h-9 w-12 object-cover"
                      />
                    </button>
                  }
                />
              )}
              {customer.idImageBackUrl && (
                <ImagePreviewDialog
                  src={resolveAssetUrl(customer.idImageBackUrl) ?? ''}
                  alt={t('viewIdImageBack')}
                  trigger={
                    <button
                      type="button"
                      title={t('viewIdImageBack')}
                      className="overflow-hidden rounded-md border border-border transition-opacity hover:opacity-80"
                    >
                      <img
                        src={resolveAssetUrl(customer.idImageBackUrl) ?? undefined}
                        alt=""
                        className="h-9 w-12 object-cover"
                      />
                    </button>
                  }
                />
              )}
            </div>
          )}
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

      <CustomerQrDialog
        open={qrOpen}
        onOpenChange={setQrOpen}
        customerName={customer.name}
        publicUrl={publicUrl}
      />
      <CustomerNotificationHistoryDialog
        customerId={customer.id}
        customerName={customer.name}
        open={historyOpen}
        onOpenChange={setHistoryOpen}
      />
    </div>
  );
}
