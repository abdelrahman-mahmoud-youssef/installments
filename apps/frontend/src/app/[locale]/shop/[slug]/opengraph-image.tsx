import { getTranslations } from 'next-intl/server';
import { getPublicShop } from '@/lib/api/public';
import { resolveAssetUrl } from '@/lib/assets';
import { OG_IMAGE_SIZE, renderOgImageResponse } from '@/lib/render-og-image';

export const size = OG_IMAGE_SIZE;
export const contentType = 'image/png';

export default async function Image({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const [shop, t] = await Promise.all([getPublicShop(slug), getTranslations({ locale, namespace: 'publicShop' })]);

  if (!shop) {
    return renderOgImageResponse({ logoUrl: null, brandColor: 'emerald', title: t('notFound') });
  }

  return renderOgImageResponse({
    logoUrl: resolveAssetUrl(shop.logoUrl),
    brandColor: shop.brandColor,
    title: shop.displayName,
    subtitle: t('ogTagline'),
  });
}
