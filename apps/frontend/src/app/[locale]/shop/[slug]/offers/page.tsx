import type { Metadata } from 'next';
import { getLocale, getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { BackLink } from '@/components/shared/back-link';
import { BrandLogo } from '@/components/shared/logo';
import { OfferCard } from '@/components/shop/offer-card';
import { getPublicShop } from '@/lib/api/public';
import { resolveAssetUrl } from '@/lib/assets';
import { brandColorCssVars } from '@/lib/brand-colors';
import { demoOffers } from '@/lib/demo-offers';
import { routes } from '@/lib/routes';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const [shop, t] = await Promise.all([getPublicShop(slug), getTranslations('publicShop.offers')]);
  return { title: shop ? `${t('title')} — ${shop.displayName}` : undefined };
}

export default async function ShopOffersPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [shop, t, locale] = await Promise.all([
    getPublicShop(slug),
    getTranslations('publicShop.offers'),
    getLocale(),
  ]);

  if (!shop) {
    notFound();
  }

  const logoUrl = resolveAssetUrl(shop.logoUrl);

  return (
    <div className="min-h-screen bg-muted/25">
      <style>{`:root{${brandColorCssVars(shop.brandColor)}}`}</style>
      <header className="border-b border-border bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-20 max-w-2xl items-center justify-between px-4">
          <BrandLogo logoUrl={logoUrl} label={shop.displayName} size="lg" />
        </div>
      </header>

      <main className="mx-auto max-w-2xl space-y-5 px-4 py-8">
        <BackLink href={routes.publicShop(slug)} label={t('backToShop')} />

        <div className="space-y-1">
          <h1 className="font-heading text-2xl font-semibold tracking-tight text-foreground">{t('title')}</h1>
          <p className="text-sm text-muted-foreground">{t('subtitle')}</p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {demoOffers.map((offer) => (
            <OfferCard key={offer.id} offer={offer} locale={locale} />
          ))}
        </div>
      </main>

      <footer className="pb-10 text-center text-xs text-muted-foreground">{shop.displayName}</footer>
    </div>
  );
}
