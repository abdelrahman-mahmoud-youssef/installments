import { View } from 'react-native';
import { JameyaDetail } from '@/api/jameyas';
import { AppText } from '@/components/ui/app-text';
import { Badge } from '@/components/ui/badge';
import { StatCard } from '@/components/ui/stat-card';
import { useI18n } from '@/i18n/i18n-context';
import { formatMoney, formatNumber } from '@/lib/format';
import { jameyaStatusTone } from '@/lib/jameya';
import { spacing } from '@/theme/tokens';

export function JameyaSummary({ jameya }: { jameya: JameyaDetail }) {
  const { t, locale } = useI18n();
  const money = (minorUnits: number) => formatMoney(minorUnits, locale);

  return (
    <View style={{ gap: spacing.lg }}>
      <View style={{ gap: spacing.sm }}>
        <Badge label={t(`jameyas.status.${jameya.status}`)} tone={jameyaStatusTone[jameya.status]} />
        <AppText variant="caption" tone="muted">
          {`${t('jameyas.detail.summaryLine', {
            members: formatNumber(jameya.shareCount, locale),
            recurrence: t(`recurrenceType.${jameya.recurrenceType}`),
          })} · ${money(jameya.shareAmount)} ${t('jameyas.detail.perShare')}`}
        </AppText>
        {jameya.notes ? (
          <AppText variant="caption" tone="muted">
            {jameya.notes}
          </AppText>
        ) : null}
      </View>
      <View style={{ gap: spacing.md }}>
        <View style={{ flexDirection: 'row', gap: spacing.md }}>
          <StatCard icon="wallet-outline" label={t('jameyas.detail.pot')} value={money(jameya.potAmount)} />
          <StatCard
            icon="cash-outline"
            label={t('jameyas.detail.collected')}
            value={money(jameya.collectedAmount)}
            tone="success"
          />
        </View>
        <View style={{ flexDirection: 'row', gap: spacing.md }}>
          <StatCard
            icon="hand-left-outline"
            label={t('jameyas.detail.paidOut')}
            value={money(jameya.paidOutAmount)}
            tone="info"
          />
          <StatCard
            icon="shield-half-outline"
            label={t('jameyas.detail.shopCovered')}
            value={money(jameya.exposureAmount)}
            tone={jameya.exposureAmount > 0 ? 'warning' : 'neutral'}
          />
        </View>
      </View>
    </View>
  );
}
