import { useTranslations } from 'next-intl';
import { Logo } from '@/components/shared/logo';

const NAV_LINKS = [
  { key: 'features', href: '#features' },
  { key: 'howItWorks', href: '#how-it-works' },
  { key: 'faq', href: '#faq' },
] as const;

export function MarketingFooter() {
  const t = useTranslations('landing.nav');
  const tFooter = useTranslations('landing.footer');
  const tCommon = useTranslations('common');
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-6 px-4 py-10 text-center sm:px-6 lg:px-8">
        <Logo label={tCommon('appName')} />
        <p className="max-w-sm text-sm text-muted-foreground">{tFooter('tagline')}</p>

        <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
          {NAV_LINKS.map((link) => (
            <a
              key={link.key}
              href={link.href}
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {t(link.key)}
            </a>
          ))}
        </nav>

        <p className="text-xs text-muted-foreground">
          © {year} {tCommon('appName')}. {tFooter('rights')}
        </p>
      </div>
    </footer>
  );
}
