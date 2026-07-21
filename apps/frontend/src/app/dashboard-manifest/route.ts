import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { getBrandingServer } from '@/lib/api/branding';
import { BRAND_COLOR_VALUES } from '@/lib/brand-colors';
import { config } from '@/lib/config';
import { getTranslations } from 'next-intl/server';
import { routing } from '@/i18n/routing';

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get(config.authCookieName)?.value;
  const branding = token ? await getBrandingServer(token) : null;
  const t = await getTranslations({ locale: routing.defaultLocale, namespace: 'common' });

  const name = branding?.displayName ?? t('appName');
  const themeColor = branding ? BRAND_COLOR_VALUES[branding.brandColor] : '#0f7a5f';

  return NextResponse.json(
    {
      name,
      short_name: name,
      description: t('appDescription'),
      start_url: '/dashboard',
      scope: '/',
      display: 'standalone',
      background_color: '#ffffff',
      theme_color: themeColor,
      icons: [
        { src: '/dashboard-icons/192', sizes: '192x192', type: 'image/png', purpose: 'any' },
        { src: '/dashboard-icons/512', sizes: '512x512', type: 'image/png', purpose: 'any' },
      ],
    },
    { headers: { 'Content-Type': 'application/manifest+json' } },
  );
}
