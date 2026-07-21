import { getPublicShop } from '@/lib/api/public';
import { resolveAssetUrl } from '@/lib/assets';
import { ogMessage } from '@/lib/og-messages';
import { OG_IMAGE_SIZE, renderOgImageResponse } from '@/lib/render-og-image';

export const size = OG_IMAGE_SIZE;
export const contentType = 'image/png';

export default async function Image({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const shop = await getPublicShop(slug);

  if (!shop) {
    return renderOgImageResponse({
      logoUrl: null,
      brandColor: 'emerald',
      title: ogMessage(locale, 'publicShop', 'notFound'),
    });
  }

  return renderOgImageResponse({
    logoUrl: resolveAssetUrl(shop.logoUrl),
    brandColor: shop.brandColor,
    title: shop.displayName,
    subtitle: ogMessage(locale, 'publicShop', 'ogTagline'),
  });
}
