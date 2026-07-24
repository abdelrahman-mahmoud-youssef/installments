import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { ContractPayAction } from '@/components/customer-portal/contract-pay-action';
import { PaymentMethodIcon } from '@/components/shared/payment-method-icon';
import { BackLink } from '@/components/shared/back-link';
import { FontSizeToggle } from '@/components/shared/font-size-toggle';
import { LanguageSwitcher } from '@/components/shared/language-switcher';
import { BrandLogo } from '@/components/shared/logo';
import { ThemeToggle } from '@/components/shared/theme-toggle';
import { Link } from '@/i18n/navigation';
import { resolveAssetUrl } from '@/lib/assets';
import { brandColorCssVars } from '@/lib/brand-colors';
import { getContractPayInfo } from '@/lib/api/public';
import { routes } from '@/lib/routes';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ uuid: string; contractId: string }>;
}): Promise<Metadata> {
  const { uuid, contractId } = await params;
  const [payInfo, t] = await Promise.all([
    getContractPayInfo(uuid, contractId),
    getTranslations('publicCustomer'),
  ]);
  return {
    title: payInfo ? `${t('payPageTitle')} · ${payInfo.branding.displayName}` : undefined,
  };
}

export default async function ContractPayPage({
  params,
}: {
  params: Promise<{ uuid: string; contractId: string }>;
}) {
  const { uuid, contractId } = await params;
  const [payInfo, t] = await Promise.all([
    getContractPayInfo(uuid, contractId),
    getTranslations('publicCustomer'),
  ]);

  if (!payInfo) {
    notFound();
  }

  const logoUrl = resolveAssetUrl(payInfo.branding.logoUrl);

  return (
    <div className="min-h-screen bg-muted/25">
      <style>{`:root{${brandColorCssVars(payInfo.branding.brandColor)}}`}</style>
      <header className="border-b border-border bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-20 max-w-2xl items-center justify-between px-4">
          <Link href={routes.publicCustomer(uuid)}>
            <BrandLogo logoUrl={logoUrl} label={payInfo.branding.displayName} size="lg" />
          </Link>
          <div className="flex items-center gap-1">
            <FontSizeToggle />
            <ThemeToggle />
            <LanguageSwitcher />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-2xl space-y-5 px-4 py-8">
        <BackLink href={routes.publicContract(uuid, contractId)} label={t('back')} />

        <h1 className="font-heading text-2xl font-semibold tracking-tight">{t('payPageTitle')}</h1>

        <div className="space-y-3 rounded-xl border border-border bg-card p-5 shadow-xs">
          <div>
            <h2 className="font-heading font-semibold">{t('payHintTitle')}</h2>
            <p className="mt-0.5 text-sm text-muted-foreground">{t('payHintDescription')}</p>
          </div>
          {payInfo.paymentMethods.length > 0 && (
            <ul className="space-y-2">
              {payInfo.paymentMethods.map((method) => (
                <li
                  key={method.id}
                  className="flex items-center gap-2.5 rounded-lg border border-border p-3 text-sm"
                >
                  <PaymentMethodIcon presetKey={method.presetKey} />
                  <span className="min-w-0">
                    <span className="block font-medium">{method.label}</span>
                    <span className="block text-xs text-muted-foreground" dir="ltr">
                      {method.details}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <ContractPayAction
          publicId={uuid}
          contractPublicId={contractId}
          amountDue={payInfo.amountDue}
          hasPendingClaim={payInfo.hasPendingClaim}
          paymentMethods={payInfo.paymentMethods}
        />
      </main>
    </div>
  );
}
