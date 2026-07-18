import { getLocale } from 'next-intl/server';
import { redirect } from '@/i18n/navigation';
import { routes } from '@/lib/routes';

export default async function RootPage() {
  const locale = await getLocale();
  redirect({ href: routes.dashboard, locale });
}
