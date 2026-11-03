import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { getLocale } from 'next-intl/server';
import { PlatformShell } from '@/components/platform/platform-shell';
import { redirect } from '@/i18n/navigation';
import { config } from '@/lib/config';
import { routes } from '@/lib/routes';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function PlatformConsoleLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  if (!cookieStore.get(config.platformAuthCookieName)?.value) {
    redirect({ href: routes.platformLogin, locale: await getLocale() });
  }

  return <PlatformShell>{children}</PlatformShell>;
}
