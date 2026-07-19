import { ChevronRight, MessageCircle } from 'lucide-react';
import { getLocale, getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { LanguageSwitcher } from '@/components/shared/language-switcher';
import { BrandLogo } from '@/components/shared/logo';
import { StatusBadge } from '@/components/shared/status-badge';
import { ThemeToggle } from '@/components/shared/theme-toggle';
import { Link } from '@/i18n/navigation';
import { resolveAssetUrl } from '@/lib/assets';
import { brandColorCssVars } from '@/lib/brand-colors';
import { getPublicCustomer } from '@/lib/api/public';
import { formatDate, formatMoney } from '@/lib/format';
import { routes } from '@/lib/routes';
import { TelegramCard } from './telegram-card';

export default async function PublicCustomerPage({
  params,
}: {
  params: Promise<{ uuid: string }>;
}) {
  const { uuid } = await params;
  const [customer, t, locale] = await Promise.all([
    getPublicCustomer(uuid),
    getTranslations('publicCustomer'),
    getLocale(),
  ]);

  if (!customer) {
    notFound();
  }

  const totalRemaining = customer.contracts.reduce((sum, contract) => sum + contract.remainingAmount, 0);
  const totalPaid = customer.contracts.reduce((sum, contract) => sum + contract.paidAmount, 0);
  const logoUrl = resolveAssetUrl(customer.branding.logoUrl);
  const whatsappPhone = customer.branding.phone?.replace(/\D/g, '') || null;

  return (
    <div className="min-h-screen bg-muted/25">
      <style>{`:root{${brandColorCssVars(customer.branding.brandColor)}}`}</style>
      <header className="border-b border-border bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-2xl items-center justify-between px-4">
          <Link href={routes.publicShop(customer.branding.slug)}>
            <BrandLogo logoUrl={logoUrl} label={customer.branding.displayName} />
          </Link>
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <LanguageSwitcher />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-2xl space-y-5 px-4 py-8">
        <div className="overflow-hidden rounded-2xl bg-primary p-6 text-primary-foreground shadow-brand">
          <p className="text-sm text-primary-foreground/75">{t('welcome')}</p>
          <h1 className="mt-0.5 font-heading text-2xl font-semibold tracking-tight">{customer.name}</h1>
          {customer.contracts.length > 0 && (
            <div className="mt-5 grid grid-cols-2 gap-4">
              <div className="rounded-xl bg-white/10 p-4">
                <p className="text-xs text-primary-foreground/70">{t('remaining')}</p>
                <p className="mt-0.5 font-heading text-xl font-semibold tabular-nums">
                  {formatMoney(totalRemaining, locale)}
                </p>
              </div>
              <div className="rounded-xl bg-white/10 p-4">
                <p className="text-xs text-primary-foreground/70">{t('paid')}</p>
                <p className="mt-0.5 font-heading text-xl font-semibold tabular-nums">
                  {formatMoney(totalPaid, locale)}
                </p>
              </div>
            </div>
          )}
        </div>

        {customer.telegram.available && <TelegramCard telegram={customer.telegram} publicId={uuid} />}

        {customer.contracts.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-card p-10 text-center text-sm text-muted-foreground">
            {t('noContracts')}
          </div>
        ) : (
          customer.contracts.map((contract, index) => {
            const contractTotal = contract.paidAmount + contract.remainingAmount;
            const ratio =
              contractTotal > 0 ? Math.min(1, Math.max(0, contract.paidAmount / contractTotal)) : 0;
            return (
              <Link
                key={index}
                href={routes.publicContract(uuid, contract.publicId)}
                className="block space-y-4 rounded-xl border border-border bg-card p-5 shadow-xs transition-shadow hover:shadow-md"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-2">
                    <h2 className="truncate font-heading font-semibold">{contract.productName}</h2>
                    <StatusBadge status={contract.status} />
                  </div>
                  <span className="shrink-0 text-sm font-semibold tabular-nums text-primary">
                    {Math.round(ratio * 100)}%
                  </span>
                </div>

                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{ width: `${ratio * 100}%` }}
                  />
                </div>

                <div
                  className={`grid gap-3 text-sm ${contract.totalAmount !== undefined ? 'grid-cols-3' : 'grid-cols-2'}`}
                >
                  {contract.totalAmount !== undefined && (
                    <div>
                      <p className="text-xs text-muted-foreground">{t('total')}</p>
                      <p className="mt-0.5 font-medium tabular-nums">
                        {formatMoney(contract.totalAmount, locale)}
                      </p>
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
                    <p className="mt-0.5 font-medium tabular-nums">
                      {formatMoney(contract.remainingAmount, locale)}
                    </p>
                  </div>
                </div>

                {Boolean(contract.downPayment) && (
                  <p className="text-xs text-muted-foreground">
                    {t('downPayment')}: <span className="font-medium">{formatMoney(contract.downPayment as number, locale)}</span>
                  </p>
                )}

                {contract.nextInstallment && (
                  <div className="flex items-center justify-between border-t border-border pt-4 text-sm">
                    <span className="flex items-center gap-2 text-muted-foreground">
                      {t('nextPayment')}
                      {contract.nextInstallment.isOverdue && <StatusBadge status="OVERDUE" />}
                    </span>
                    <span className="font-medium tabular-nums">
                      {formatDate(contract.nextInstallment.dueDate, locale)} ·{' '}
                      {formatMoney(contract.nextInstallment.amount, locale)}
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-end gap-1 text-xs font-medium text-primary">
                  {t('viewDetails')}
                  <ChevronRight className="size-3.5 rtl:rotate-180" />
                </div>
              </Link>
            );
          })
        )}
      </main>

      <footer className="pb-10 text-center text-xs text-muted-foreground">{customer.branding.displayName}</footer>

      {whatsappPhone && (
        <a
          href={`https://wa.me/${whatsappPhone}`}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={t('whatsappLabel')}
          className="fixed bottom-5 end-5 z-50 grid size-14 place-items-center rounded-full bg-[#25D366] text-white shadow-lg transition-transform hover:scale-105"
        >
          <MessageCircle className="size-7" fill="currentColor" />
        </a>
      )}
    </div>
  );
}
