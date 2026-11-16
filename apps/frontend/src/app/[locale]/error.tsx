'use client';

import { ServerCrash } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect } from 'react';
import { MarketingShell } from '@/components/marketing/marketing-shell';
import { StatusMessage } from '@/components/marketing/status-message';
import { Button } from '@/components/ui/button';
import { Link } from '@/i18n/navigation';
import { routes } from '@/lib/routes';

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations('error');
  const tNotFound = useTranslations('notFound');

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <MarketingShell>
      <StatusMessage icon={ServerCrash} tone="danger" title={t('title')} description={t('description')}>
        <Button size="xl" onClick={reset}>
          {t('retry')}
        </Button>
        <Button size="xl" variant="outline" render={<Link href={routes.home} />}>
          {tNotFound('backHome')}
        </Button>
      </StatusMessage>
    </MarketingShell>
  );
}
