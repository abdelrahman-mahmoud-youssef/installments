import { NextResponse } from 'next/server';
import { routing } from '@/i18n/routing';
import { getPublicShop } from '@/lib/api/public';
import { BRAND_COLOR_VALUES } from '@/lib/brand-colors';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ locale: string; slug: string }> },
) {
  const { locale, slug } = await params;
  const shop = await getPublicShop(slug);
  const prefix = locale === routing.defaultLocale ? '' : `/${locale}`;
  const name = shop?.displayName ?? slug;
  const themeColor = shop ? BRAND_COLOR_VALUES[shop.brandColor] : '#0f7a5f';

  return NextResponse.json(
    {
      name,
      short_name: name,
      start_url: `${prefix}/shop/${slug}`,
      scope: `/shop/${slug}`,
      display: 'standalone',
      background_color: '#ffffff',
      theme_color: themeColor,
      icons: [
        { src: `/shop/${slug}/icons/192`, sizes: '192x192', type: 'image/png', purpose: 'any' },
        { src: `/shop/${slug}/icons/512`, sizes: '512x512', type: 'image/png', purpose: 'any' },
      ],
    },
    { headers: { 'Content-Type': 'application/manifest+json' } },
  );
}
