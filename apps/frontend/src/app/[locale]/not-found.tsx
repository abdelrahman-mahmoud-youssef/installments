import { FileQuestion } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { LanguageSwitcher } from '@/components/shared/language-switcher';
import { LogoMark } from '@/components/shared/logo';
import { ThemeToggle } from '@/components/shared/theme-toggle';
import { Button } from '@/components/ui/button';
import { Link } from '@/i18n/navigation';
import { routes } from '@/lib/routes';

export default async function NotFound() {
  const t = await getTranslations('notFound');

  return (
    <div className="flex min-h-screen flex-col bg-background px-6 py-6 sm:px-10">
      <div className="flex items-center justify-between">
        <LogoMark className="size-9" />
        <div className="flex items-center gap-1">
          <ThemeToggle />
          <LanguageSwitcher />
        </div>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center gap-5 py-10 text-center">
        <div className="grid size-16 place-items-center rounded-full bg-muted text-muted-foreground">
          <FileQuestion className="size-7" strokeWidth={1.8} />
        </div>
        <div className="space-y-2">
          <h1 className="font-heading text-2xl font-semibold tracking-tight">{t('title')}</h1>
          <p className="mx-auto max-w-sm text-sm text-muted-foreground">{t('description')}</p>
        </div>
        <Button render={<Link href={routes.home} />}>{t('backHome')}</Button>
      </div>
    </div>
  );
}
