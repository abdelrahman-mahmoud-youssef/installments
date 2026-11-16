import { useTranslations } from 'next-intl';
import { MarketingFooter } from '@/components/marketing/marketing-footer';
import { MarketingHeader } from '@/components/marketing/marketing-header';

const MAIN_CONTENT_ID = 'main-content';

export function MarketingShell({ children }: { children: React.ReactNode }) {
  const t = useTranslations('common');

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <a
        href={`#${MAIN_CONTENT_ID}`}
        className="sr-only z-50 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground focus:not-sr-only focus:fixed focus:start-4 focus:top-3"
      >
        {t('skipToContent')}
      </a>
      <MarketingHeader />
      <main id={MAIN_CONTENT_ID} tabIndex={-1} className="flex-1 outline-none">
        {children}
      </main>
      <MarketingFooter />
    </div>
  );
}
