import { useTranslations } from 'next-intl';
import { Logo } from '@/components/shared/logo';
import { Link } from '@/i18n/navigation';
import { config } from '@/lib/config';
import { HOME_SECTIONS } from '@/lib/home-sections';
import { routes } from '@/lib/routes';

const FOOTER_LINK_CLASS =
  'rounded-sm text-sm text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/45';

export function MarketingFooter() {
  const t = useTranslations('landing.nav');
  const tFooter = useTranslations('landing.footer');
  const tCommon = useTranslations('common');
  const year = new Date().getFullYear();

  const columns = [
    {
      heading: tFooter('productHeading'),
      links: HOME_SECTIONS.map((section) => ({ label: t(section.key), href: `${routes.home}#${section.id}` })),
    },
    {
      heading: tFooter('legalHeading'),
      links: [
        { label: tFooter('privacyLink'), href: routes.privacy },
        { label: tFooter('termsLink'), href: routes.terms },
      ],
    },
    {
      heading: tFooter('helpHeading'),
      links: [{ label: tFooter('contactLink'), href: routes.publicContact }],
    },
  ];

  return (
    <footer className="border-t border-border bg-card/60">
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-x-6 gap-y-10 px-4 py-12 sm:px-6 md:grid-cols-[1.4fr_repeat(3,1fr)] lg:px-8 lg:py-16">
        <div className="col-span-2 space-y-4 md:col-span-1">
          <Logo label={tCommon('appName')} />
          <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">{tFooter('tagline')}</p>
          <a href={`mailto:${config.contactEmail}`} dir="ltr" className={FOOTER_LINK_CLASS}>
            {config.contactEmail}
          </a>
        </div>
        {columns.map((column) => (
          <nav key={column.heading} aria-label={column.heading} className="space-y-3">
            <p className="text-sm font-semibold text-foreground">{column.heading}</p>
            <ul className="space-y-2.5">
              {column.links.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className={FOOTER_LINK_CLASS}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <div className="border-t border-border">
        <p className="mx-auto max-w-6xl px-4 py-5 text-xs text-muted-foreground sm:px-6 lg:px-8">
          © {year} {tCommon('appName')}. {tFooter('rights')}
        </p>
      </div>
    </footer>
  );
}
