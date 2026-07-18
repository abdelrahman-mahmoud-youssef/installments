import { getLocale, getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { LanguageSwitcher } from '@/components/shared/language-switcher';
import { Logo } from '@/components/shared/logo';
import { ThemeToggle } from '@/components/shared/theme-toggle';
import { getPublicCustomer } from '@/lib/api/public';
import { formatDate, formatMoney } from '@/lib/format';

export default async function PublicCustomerPage({
  params,
}: {
  params: Promise<{ uuid: string }>;
}) {
  const { uuid } = await params;
  const [customer, t, tCommon, locale] = await Promise.all([
    getPublicCustomer(uuid),
    getTranslations('publicCustomer'),
    getTranslations('common'),
    getLocale(),
  ]);

  if (!customer) {
    notFound();
  }

  const totalRemaining = customer.contracts.reduce((sum, contract) => sum + contract.remainingAmount, 0);
  const totalPaid = customer.contracts.reduce((sum, contract) => sum + contract.paidAmount, 0);

  return (
    <div className="min-h-screen bg-muted/25">
      <header className="border-b border-border bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-2xl items-center justify-between px-4">
          <Logo label={tCommon('appName')} />
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

        {customer.contracts.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-card p-10 text-center text-sm text-muted-foreground">
            {t('noContracts')}
          </div>
        ) : (
          customer.contracts.map((contract, index) => {
            const ratio =
              contract.totalAmount > 0
                ? Math.min(1, Math.max(0, contract.paidAmount / contract.totalAmount))
                : 0;
            return (
              <div key={index} className="space-y-4 rounded-xl border border-border bg-card p-5 shadow-xs">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="font-heading font-semibold">{contract.productName}</h2>
                  <span className="text-sm font-semibold tabular-nums text-primary">
                    {Math.round(ratio * 100)}%
                  </span>
                </div>

                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{ width: `${ratio * 100}%` }}
                  />
                </div>

                <div className="grid grid-cols-3 gap-3 text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground">{t('total')}</p>
                    <p className="mt-0.5 font-medium tabular-nums">
                      {formatMoney(contract.totalAmount, locale)}
                    </p>
                  </div>
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

                {contract.upcomingInstallments.length > 0 && (
                  <div className="border-t border-border pt-4">
                    <p className="mb-2.5 text-xs font-medium text-muted-foreground">{t('upcoming')}</p>
                    <ul className="space-y-2">
                      {contract.upcomingInstallments.map((installment, installmentIndex) => (
                        <li key={installmentIndex} className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">
                            {formatDate(installment.dueDate, locale)}
                          </span>
                          <span className="font-medium tabular-nums">
                            {formatMoney(installment.remainingAmount, locale)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            );
          })
        )}
      </main>

      <footer className="pb-10 text-center text-xs text-muted-foreground">{tCommon('appName')}</footer>
    </div>
  );
}
