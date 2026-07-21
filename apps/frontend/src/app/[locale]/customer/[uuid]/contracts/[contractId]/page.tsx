import { Store } from 'lucide-react';
import type { Metadata } from 'next';
import { getLocale, getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { BackLink } from '@/components/shared/back-link';
import { FontSizeToggle } from '@/components/shared/font-size-toggle';
import { LanguageSwitcher } from '@/components/shared/language-switcher';
import { BrandLogo } from '@/components/shared/logo';
import { StatusBadge } from '@/components/shared/status-badge';
import { ThemeToggle } from '@/components/shared/theme-toggle';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Link } from '@/i18n/navigation';
import { getPublicContractDetail } from '@/lib/api/public';
import { resolveAssetUrl } from '@/lib/assets';
import { brandColorCssVars } from '@/lib/brand-colors';
import { formatDate, formatMoney } from '@/lib/format';
import { routes } from '@/lib/routes';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ uuid: string; contractId: string }>;
}): Promise<Metadata> {
  const { uuid, contractId } = await params;
  const [contract, t] = await Promise.all([
    getPublicContractDetail(uuid, contractId),
    getTranslations('publicCustomer'),
  ]);
  return {
    title: contract ? `${contract.productName} · ${contract.branding.displayName}` : undefined,
    description: contract
      ? t('ogContractDescription', { product: contract.productName, shop: contract.branding.displayName })
      : undefined,
  };
}

export default async function PublicContractDetailPage({
  params,
}: {
  params: Promise<{ uuid: string; contractId: string }>;
}) {
  const { uuid, contractId } = await params;
  const [contract, t, locale] = await Promise.all([
    getPublicContractDetail(uuid, contractId),
    getTranslations('publicCustomer'),
    getLocale(),
  ]);

  if (!contract) {
    notFound();
  }

  const logoUrl = resolveAssetUrl(contract.branding.logoUrl);
  const contractTotal = contract.paidAmount + contract.remainingAmount;
  const ratio = contractTotal > 0 ? Math.min(1, Math.max(0, contract.paidAmount / contractTotal)) : 0;
  const outstandingInstallments = contract.installments.filter(
    (installment) => installment.status === 'PENDING' || installment.status === 'PARTIALLY_PAID',
  );

  return (
    <div className="min-h-screen bg-muted/25">
      <style>{`:root{${brandColorCssVars(contract.branding.brandColor)}}`}</style>
      <header className="border-b border-border bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-20 max-w-2xl items-center justify-between px-4">
          <Link href={routes.publicShop(contract.branding.slug)}>
            <BrandLogo logoUrl={logoUrl} label={contract.branding.displayName} size="lg" />
          </Link>
          <div className="flex items-center gap-1">
            <FontSizeToggle />
            <ThemeToggle />
            <LanguageSwitcher />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-2xl space-y-5 px-4 py-8">
        <BackLink href={routes.publicCustomer(uuid)} label={t('back')} />

        <div className="space-y-4 rounded-xl border border-border bg-card p-5 shadow-xs">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2">
              <h1 className="truncate font-heading text-lg font-semibold">{contract.productName}</h1>
              <StatusBadge status={contract.status} />
            </div>
            <span className="shrink-0 text-sm font-semibold tabular-nums text-primary">
              {Math.round(ratio * 100)}%
            </span>
          </div>

          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${ratio * 100}%` }} />
          </div>

          <div
            className={`grid gap-3 text-sm ${contract.totalAmount !== undefined ? 'grid-cols-3' : 'grid-cols-2'}`}
          >
            {contract.totalAmount !== undefined && (
              <div>
                <p className="text-xs text-muted-foreground">{t('total')}</p>
                <p className="mt-0.5 font-medium tabular-nums">{formatMoney(contract.totalAmount, locale)}</p>
              </div>
            )}
            <div>
              <p className="text-xs text-muted-foreground">{t('paid')}</p>
              <p className="mt-0.5 font-medium tabular-nums text-success">
                {formatMoney(contract.paidAmount, locale)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{t('remaining')}</p>
              <p className="mt-0.5 font-medium tabular-nums">{formatMoney(contract.remainingAmount, locale)}</p>
            </div>
          </div>

          {Boolean(contract.downPayment) && (
            <p className="text-xs text-muted-foreground">
              {t('downPayment')}:{' '}
              <span className="font-medium">{formatMoney(contract.downPayment as number, locale)}</span>
            </p>
          )}
        </div>

        <div className="rounded-xl border border-border bg-card p-5 shadow-xs">
          <Tabs defaultValue="payments">
            <TabsList className="w-full">
              <TabsTrigger value="payments">{t('tabPayments')}</TabsTrigger>
              <TabsTrigger value="upcoming">{t('upcoming')}</TabsTrigger>
            </TabsList>
            <TabsContent value="payments">
              {contract.payments.length > 0 ? (
                <ul className="space-y-2">
                  {contract.payments.map((payment, index) => (
                    <li key={index} className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{formatDate(payment.paidAt, locale)}</span>
                      <span className="font-medium tabular-nums text-success">
                        {formatMoney(payment.amount, locale)}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="py-2 text-muted-foreground">{t('noPayments')}</p>
              )}
            </TabsContent>
            <TabsContent value="upcoming">
              {outstandingInstallments.length > 0 ? (
                <ul className="space-y-2">
                  {outstandingInstallments.map((installment) => (
                    <li key={installment.sequence} className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2 text-muted-foreground">
                        #{installment.sequence} · {formatDate(installment.dueDate, locale)}
                        {installment.isOverdue && <StatusBadge status="OVERDUE" />}
                      </span>
                      <span className="font-medium tabular-nums">
                        {formatMoney(installment.amount - installment.paidAmount, locale)}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="py-2 text-muted-foreground">{t('noUpcoming')}</p>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <footer className="flex justify-center pb-10">
        <Link
          href={routes.publicShop(contract.branding.slug)}
          className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-4 py-2 text-xs font-medium text-muted-foreground transition-colors hover:text-primary"
        >
          <Store className="size-3.5" />
          {t('visitStore', { name: contract.branding.displayName })}
        </Link>
      </footer>
    </div>
  );
}
