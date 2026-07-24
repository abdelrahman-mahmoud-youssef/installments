import { NextResponse } from 'next/server';
import { routing } from '@/i18n/routing';
import { getPublicCustomer } from '@/lib/api/public';
import { BRAND_COLOR_VALUES } from '@/lib/brand-colors';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ locale: string; uuid: string }> },
) {
  const { locale, uuid } = await params;
  const customer = await getPublicCustomer(uuid);
  const prefix = locale === routing.defaultLocale ? '' : `/${locale}`;
  const name = customer?.name ?? 'Customer';
  const themeColor = customer ? BRAND_COLOR_VALUES[customer.branding.brandColor] : '#0562e6';

  return NextResponse.json(
    {
      name,
      short_name: name,
      start_url: `${prefix}/customer/${uuid}`,
      scope: `/customer/${uuid}`,
      display: 'standalone',
      background_color: '#ffffff',
      theme_color: themeColor,
      icons: [
        { src: `/customer/${uuid}/icons/192`, sizes: '192x192', type: 'image/png', purpose: 'any' },
        { src: `/customer/${uuid}/icons/512`, sizes: '512x512', type: 'image/png', purpose: 'any' },
      ],
    },
    { headers: { 'Content-Type': 'application/manifest+json' } },
  );
}
