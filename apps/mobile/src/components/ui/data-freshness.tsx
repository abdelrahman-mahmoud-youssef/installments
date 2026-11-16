import { describeDataAge } from '@/lib/data-age';
import { useI18n } from '@/i18n/i18n-context';
import { formatNumber } from '@/lib/format';
import { AppText } from './app-text';

interface DataFreshnessProps {
  updatedAt: number;
  hasRefreshFailed: boolean;
}

export function DataFreshness({ updatedAt, hasRefreshFailed }: DataFreshnessProps) {
  const { t, locale } = useI18n();
  const age = updatedAt > 0 ? describeDataAge(updatedAt, Date.now()) : null;

  if (!age && !hasRefreshFailed) {
    return null;
  }

  const ageText = age ? t(`common.dataUpdated.${age.unit}`, { count: formatNumber(age.count, locale) }) : '';
  const message = hasRefreshFailed ? [t('common.dataRefreshFailed'), ageText].filter(Boolean).join(' · ') : ageText;

  return (
    <AppText variant="label" tone={hasRefreshFailed ? 'danger' : 'faint'}>
      {message}
    </AppText>
  );
}
