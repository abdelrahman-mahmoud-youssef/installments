'use client';

import { LogOut, Menu, Store, User } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useState } from 'react';
import { InstallBanner } from '@/components/shared/install-banner';
import { LanguageSwitcher } from '@/components/shared/language-switcher';
import { BrandLogo } from '@/components/shared/logo';
import { ThemeToggle } from '@/components/shared/theme-toggle';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Link, usePathname, useRouter } from '@/i18n/navigation';
import { logout } from '@/lib/api/auth';
import { navigationItems } from '@/lib/navigation';
import { routes } from '@/lib/routes';
import { cn } from '@/lib/utils';

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const t = useTranslations('nav');
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-0.5">
      {navigationItems.map((item) => {
        const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={isActive ? 'page' : undefined}
            className={cn(
              'relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
              'before:absolute before:inset-y-1.5 before:start-0 before:w-1 before:rounded-full before:bg-primary before:transition-opacity',
              isActive
                ? 'bg-primary/10 text-primary before:opacity-100'
                : 'text-muted-foreground before:opacity-0 hover:bg-accent hover:text-foreground',
            )}
          >
            <Icon className="size-[1.15rem]" strokeWidth={isActive ? 2.4 : 2} />
            {t(item.labelKey)}
          </Link>
        );
      })}
    </nav>
  );
}

function UserMenu({ appLabel }: { appLabel: string }) {
  const t = useTranslations('nav');
  const router = useRouter();

  async function handleLogout() {
    await logout();
    router.push(routes.login);
    router.refresh();
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="ghost" size="icon-sm" aria-label={t('account')}>
            <span className="grid size-7 place-items-center rounded-full bg-primary/12 text-primary">
              <User className="size-4" />
            </span>
          </Button>
        }
      />
      <DropdownMenuContent align="end" className="min-w-48">
        <DropdownMenuGroup>
          <DropdownMenuLabel>{appLabel}</DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onClick={handleLogout}>
          <LogOut className="size-4" />
          {t('logout')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export interface AppShellBranding {
  logoUrl: string | null;
  displayName: string | null;
  slug: string | null;
}

function ViewShopPageLink({ slug, className }: { slug: string; className?: string }) {
  const t = useTranslations('common');
  return (
    <Link
      href={routes.publicShop(slug)}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        'inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-primary',
        className,
      )}
    >
      <Store className="size-3.5" />
      {t('viewShopPage')}
    </Link>
  );
}

export function AppShell({
  children,
  branding,
}: {
  children: React.ReactNode;
  branding?: AppShellBranding | null;
}) {
  const tCommon = useTranslations('common');
  const locale = useLocale();
  const [mobileOpen, setMobileOpen] = useState(false);
  const sheetSide = locale === 'ar' ? 'right' : 'left';
  const appLabel = branding?.displayName ?? tCommon('appName');
  const logoUrl = branding?.logoUrl ?? null;

  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 start-0 z-40 hidden w-64 flex-col border-e border-sidebar-border bg-sidebar md:flex">
        <div className="flex h-16 items-center px-5">
          <BrandLogo logoUrl={logoUrl} label={appLabel} />
        </div>
        {branding?.slug && <ViewShopPageLink slug={branding.slug} className="px-5 pb-3" />}
        <div className="flex-1 overflow-y-auto px-3 py-2">
          <NavLinks />
        </div>
      </aside>

      <div className="flex min-h-screen flex-col md:ps-64">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur-md sm:px-6">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger
              render={
                <Button variant="ghost" size="icon-sm" className="md:hidden" aria-label="Menu">
                  <Menu className="size-5" />
                </Button>
              }
            />
            <SheetContent side={sheetSide} className="w-72 p-0">
              <SheetTitle className="sr-only">{appLabel}</SheetTitle>
              <div className="flex h-16 items-center px-5">
                <BrandLogo logoUrl={logoUrl} label={appLabel} />
              </div>
              {branding?.slug && <ViewShopPageLink slug={branding.slug} className="px-5 pb-3" />}
              <div className="px-3 py-2">
                <NavLinks onNavigate={() => setMobileOpen(false)} />
              </div>
            </SheetContent>
          </Sheet>

          <div className="md:hidden">
            <BrandLogo logoUrl={logoUrl} label={appLabel} />
          </div>

          <div className="ms-auto flex items-center gap-1">
            <ThemeToggle />
            <LanguageSwitcher />
            <div className="mx-1 h-5 w-px bg-border" />
            <UserMenu appLabel={appLabel} />
          </div>
        </header>

        <InstallBanner storageKey="pwa-install-banner-dashboard" message={tCommon('installBannerMessage')} />

        <main className="flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
          <div className="mx-auto w-full max-w-6xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
