import { cookies } from 'next/headers';
import { getLocale } from 'next-intl/server';
import { AppShell } from '@/components/shared/app-shell';
import { config } from '@/lib/config';
import { redirect } from '@/i18n/navigation';
import { routes } from '@/lib/routes';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const token = cookieStore.get(config.authCookieName)?.value;

  if (!token) {
    const locale = await getLocale();
    redirect({ href: routes.login, locale });
  }

  return <AppShell>{children}</AppShell>;
}
