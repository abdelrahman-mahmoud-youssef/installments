'use client';

import { LogOut } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { LanguageSwitcher } from '@/components/shared/language-switcher';
import { Logo } from '@/components/shared/logo';
import { ThemeToggle } from '@/components/shared/theme-toggle';
import { Button } from '@/components/ui/button';
import { useRouter } from '@/i18n/navigation';
import { platformLogout } from '@/lib/api/platform';
import { routes } from '@/lib/routes';

export function PlatformShell({ children }: { children: React.ReactNode }) {
  const t = useTranslations('platform');
  const tCommon = useTranslations('common');
  const router = useRouter();

  async function handleLogout() {
    await platformLogout();
    router.push(routes.platformLogin);
    router.refresh();
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur-md sm:px-6">
        <Logo label={tCommon('appName')} />
        <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
          {t('consoleTitle')}
        </span>
        <div className="ms-auto flex items-center gap-1">
          <ThemeToggle />
          <LanguageSwitcher />
          <div className="mx-1 h-5 w-px bg-border" />
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            <LogOut className="size-4" />
            <span className="hidden sm:inline">{t('logout')}</span>
          </Button>
        </div>
      </header>
      <main className="flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <div className="mx-auto w-full max-w-6xl">{children}</div>
      </main>
    </div>
  );
}
