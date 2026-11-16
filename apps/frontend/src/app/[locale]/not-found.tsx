import { FileQuestion } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { MarketingShell } from '@/components/marketing/marketing-shell';
import { StatusMessage } from '@/components/marketing/status-message';
import { LanguageSwitcher } from '@/components/shared/language-switcher';
import { BrandLogo } from '@/components/shared/logo';
import { ThemeToggle } from '@/components/shared/theme-toggle';
import { Button } from '@/components/ui/button';
import { Link } from '@/i18n/navigation';
import { resolveAssetUrl } from '@/lib/assets';
import { brandColorCssVars } from '@/lib/brand-colors';
import { routes } from '@/lib/routes';
import { getTenantBrandingFromHost } from '@/lib/tenant-branding-from-host';

export default async function NotFound() {
  const [t, branding] = await Promise.all([getTranslations('notFound'), getTenantBrandingFromHost()]);

  if (!branding) {
    return (
      <MarketingShell>
        <StatusMessage icon={FileQuestion} title={t('title')} description={t('description')}>
          <Button size="xl" render={<Link href={routes.home} />}>
            {t('backHome')}
          </Button>
        </StatusMessage>
      </MarketingShell>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background px-5 py-5 sm:px-10">
      <style>{`:root{${brandColorCssVars(branding.brandColor)}}`}</style>
      <header className="flex items-center justify-between">
        <Link href="/" className="rounded-lg outline-none focus-visible:ring-[3px] focus-visible:ring-ring/45">
          <BrandLogo logoUrl={resolveAssetUrl(branding.logoUrl)} label={branding.displayName} />
        </Link>
        <div className="flex items-center gap-1">
          <LanguageSwitcher />
          <ThemeToggle />
        </div>
      </header>
      <main className="flex flex-1 items-center">
        <StatusMessage icon={FileQuestion} title={t('title')} description={t('description')}>
          <Button size="xl" render={<Link href="/" />}>
            {t('backToShop')}
          </Button>
        </StatusMessage>
      </main>
    </div>
  );
}
