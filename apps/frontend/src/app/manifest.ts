import type { MetadataRoute } from 'next';
import { getTranslations } from 'next-intl/server';
import { routing } from '@/i18n/routing';

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const t = await getTranslations({ locale: routing.defaultLocale, namespace: 'common' });

  return {
    name: t('appName'),
    short_name: t('appName'),
    description: t('appDescription'),
    start_url: '/dashboard',
    scope: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#0562e6',
    icons: [
      { src: '/qistak-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/qistak-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
    ],
  };
}
