import { Camera, MessageCircle, Music2, ThumbsUp } from 'lucide-react';
import type { Metadata } from 'next';
import { getLocale, getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { FormattedText } from '@/components/shared/formatted-text';
import { InstallAppButton } from '@/components/shared/install-app-button';
import { IosInstallHint } from '@/components/shared/ios-install-hint';
import { LanguageSwitcher } from '@/components/shared/language-switcher';
import { BrandLogo } from '@/components/shared/logo';
import { ThemeToggle } from '@/components/shared/theme-toggle';
import { InstallmentCalculator } from '@/components/shop/installment-calculator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getPublicShop } from '@/lib/api/public';
import { resolveAssetUrl } from '@/lib/assets';
import { brandColorCssVars } from '@/lib/brand-colors';

function withScheme(url: string): string {
  return /^https?:\/\//i.test(url) ? url : `https://${url}`;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const shop = await getPublicShop(slug);
  return {
    manifest: `/shop/${slug}/pwa-manifest`,
    title: shop?.displayName,
  };
}

export default async function PublicShopPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [shop, t, tCommon, locale] = await Promise.all([
    getPublicShop(slug),
    getTranslations('publicShop'),
    getTranslations('common'),
    getLocale(),
  ]);

  if (!shop) {
    notFound();
  }

  const logoUrl = resolveAssetUrl(shop.logoUrl);
  const whatsappPhone = shop.phone?.replace(/\D/g, '') || null;
  const showCalculator = shop.showInstallmentCalculator && shop.calculatorPlans.length > 0;

  const socialLinks = [
    shop.instagramUrl && {
      href: withScheme(shop.instagramUrl),
      label: t('instagramLabel'),
      icon: Camera,
      className: 'bg-gradient-to-br from-pink-500 to-purple-600',
    },
    shop.facebookUrl && {
      href: withScheme(shop.facebookUrl),
      label: t('facebookLabel'),
      icon: ThumbsUp,
      className: 'bg-blue-600',
    },
    shop.tiktokUrl && {
      href: withScheme(shop.tiktokUrl),
      label: t('tiktokLabel'),
      icon: Music2,
      className: 'bg-neutral-900',
    },
    whatsappPhone && {
      href: `https://wa.me/${whatsappPhone}`,
      label: t('whatsappLabel'),
      icon: MessageCircle,
      className: 'bg-[#25D366]',
    },
  ].filter(Boolean) as { href: string; label: string; icon: typeof Camera; className: string }[];

  return (
    <div className="min-h-screen bg-muted/25">
      <style>{`:root{${brandColorCssVars(shop.brandColor)}}`}</style>
      <header className="border-b border-border bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-20 max-w-2xl items-center justify-between px-4">
          <BrandLogo logoUrl={logoUrl} label={shop.displayName} size="lg" />
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <LanguageSwitcher />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-2xl space-y-5 px-4 py-8">
        <div className="overflow-hidden rounded-2xl bg-primary p-6 text-primary-foreground shadow-brand">
          <h1 className="font-heading text-2xl font-semibold tracking-tight">{shop.displayName}</h1>

          {socialLinks.length > 0 && (
            <div className="mt-4 flex items-center gap-2.5">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.label}
                  className={`grid size-10 place-items-center rounded-full text-white shadow-sm transition-transform hover:scale-105 ${social.className}`}
                >
                  <social.icon className="size-5" />
                </a>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <InstallAppButton label={t('installButtonLabel', { name: shop.displayName })} className="w-fit" />
          <IosInstallHint
            storageKey={`pwa-ios-hint-shop-${slug}`}
            message={t('installIosHint', { name: shop.displayName })}
            dismissLabel={tCommon('dismiss')}
          />
        </div>

        {showCalculator ? (
          <div className="rounded-xl border border-border bg-card p-5 shadow-xs">
            <Tabs defaultValue="about">
              <TabsList className="w-full">
                <TabsTrigger
                  value="about"
                  className="data-active:bg-primary data-active:text-primary-foreground dark:data-active:bg-primary dark:data-active:text-primary-foreground"
                >
                  {t('aboutTab')}
                </TabsTrigger>
                <TabsTrigger
                  value="calculator"
                  className="data-active:bg-primary data-active:text-primary-foreground dark:data-active:bg-primary dark:data-active:text-primary-foreground"
                >
                  {t('calculatorTab')}
                </TabsTrigger>
              </TabsList>
              <TabsContent value="about">
                <p className="text-[0.95rem] leading-relaxed whitespace-pre-line text-foreground">
                  {shop.about ? <FormattedText text={shop.about} /> : t('noAbout')}
                </p>
              </TabsContent>
              <TabsContent value="calculator">
                <InstallmentCalculator plans={shop.calculatorPlans} locale={locale} />
              </TabsContent>
            </Tabs>
          </div>
        ) : (
          <div className="rounded-xl border border-border bg-card p-5 shadow-xs">
            <p className="text-[0.95rem] leading-relaxed whitespace-pre-line text-foreground">
              {shop.about ? <FormattedText text={shop.about} /> : t('noAbout')}
            </p>
          </div>
        )}
      </main>

      <footer className="pb-10 text-center text-xs text-muted-foreground">{shop.displayName}</footer>
    </div>
  );
}
