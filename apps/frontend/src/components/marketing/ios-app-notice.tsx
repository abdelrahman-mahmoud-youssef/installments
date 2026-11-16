import { Smartphone } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Badge } from '@/components/ui/badge';
import { Link } from '@/i18n/navigation';
import { routes } from '@/lib/routes';

export function IosAppNotice() {
  const t = useTranslations('landing.iosApp');

  return (
    <div className="flex max-w-xl items-start gap-4 rounded-2xl border border-border bg-card p-4 shadow-xs">
      <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-ink text-ink-foreground">
        <Smartphone aria-hidden className="size-5" />
      </span>
      <div className="min-w-0 space-y-1">
        <p className="flex flex-wrap items-center gap-2 font-medium text-ink dark:text-foreground">
          {t('title')}
          <Badge variant="secondary">{t('badge')}</Badge>
        </p>
        <p className="text-sm text-pretty text-muted-foreground">
          {t('betaText')}{' '}
          <Link
            href={routes.publicContact}
            className="font-medium text-primary underline-offset-4 outline-none hover:underline focus-visible:ring-[3px] focus-visible:ring-ring/45"
          >
            {t('betaLink')}
          </Link>
        </p>
      </div>
    </div>
  );
}
