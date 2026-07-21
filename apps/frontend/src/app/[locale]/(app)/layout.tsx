import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { getLocale } from 'next-intl/server';
import { AppShell } from '@/components/shared/app-shell';
import { getBrandingServer } from '@/lib/api/branding';
import { resolveAssetUrl } from '@/lib/assets';
import { brandColorCssVars } from '@/lib/brand-colors';
import { config } from '@/lib/config';
import { redirect } from '@/i18n/navigation';
import { routes } from '@/lib/routes';

export async function generateMetadata(): Promise<Metadata> {
  const cookieStore = await cookies();
  const token = cookieStore.get(config.authCookieName)?.value;
  const branding = token ? await getBrandingServer(token) : null;

  if (!branding) {
    return { manifest: '/dashboard-manifest' };
  }
  return {
    title: { default: branding.displayName, template: `%s · ${branding.displayName}` },
    manifest: '/dashboard-manifest',
  };
}

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const token = cookieStore.get(config.authCookieName)?.value;

  if (!token) {
    const locale = await getLocale();
    redirect({ href: routes.login, locale });
  }

  const branding = await getBrandingServer(token as string);

  return (
    <>
      {branding && <style>{`:root{${brandColorCssVars(branding.brandColor)}}`}</style>}
      <AppShell
        branding={
          branding
            ? { logoUrl: resolveAssetUrl(branding.logoUrl), displayName: branding.displayName, slug: branding.slug }
            : null
        }
      >
        {children}
      </AppShell>
    </>
  );
}
