import { FileQuestion } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { LanguageSwitcher } from '@/components/shared/language-switcher';
import { BrandLogo, LogoMark } from '@/components/shared/logo';
import { ThemeToggle } from '@/components/shared/theme-toggle';
import { Button } from '@/components/ui/button';
import { Link } from '@/i18n/navigation';
import { resolveAssetUrl } from '@/lib/assets';
import { brandColorCssVars } from '@/lib/brand-colors';
import { routes } from '@/lib/routes';
import { getTenantBrandingFromHost } from '@/lib/tenant-branding-from-host';

export default async function NotFound() {
  const [t, branding] = await Promise.all([getTranslations('notFound'), getTenantBrandingFromHost()]);

  return (
    <div className="flex min-h-screen flex-col bg-background px-6 py-6 sm:px-10">
      {branding && <style>{`:root{${brandColorCssVars(branding.brandColor)}}`}</style>}
      <div className="flex items-center justify-between">
        {branding ? (
          <BrandLogo logoUrl={resolveAssetUrl(branding.logoUrl)} label={branding.displayName} />
        ) : (
          <LogoMark className="size-9" />
        )}
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
        <Button render={<Link href={branding ? '/' : routes.home} />}>
          {branding ? t('backToShop') : t('backHome')}
        </Button>
      </div>
    </div>
  );
}
