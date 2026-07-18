import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { AppShell } from '@/components/shared/app-shell';
import { config } from '@/lib/config';
import { routes } from '@/lib/routes';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const token = cookieStore.get(config.authCookieName)?.value;

  if (!token) {
    redirect(routes.login);
  }

  return <AppShell>{children}</AppShell>;
}
