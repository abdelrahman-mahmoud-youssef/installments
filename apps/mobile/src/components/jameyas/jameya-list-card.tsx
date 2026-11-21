import { View } from 'react-native';
import { JameyaListItem } from '@/api/jameyas';
import { AppText } from '@/components/ui/app-text';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { MoneyText } from '@/components/ui/money-text';
import { PressableScale } from '@/components/ui/pressable-scale';
import { useI18n } from '@/i18n/i18n-context';
import { formatCalendarDate, formatNumber } from '@/lib/format';
import { jameyaStatusTone } from '@/lib/jameya';
import { logicalTextAlign, spacing } from '@/theme/tokens';

export function JameyaListCard({ jameya, onPress }: { jameya: JameyaListItem; onPress: () => void }) {
  const { t, locale } = useI18n();
  return (
    <PressableScale onPress={onPress} accessibilityRole="button">
      <Card>
        <View style={{ gap: spacing.md }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
            <AppText variant="bodyStrong" numberOfLines={1} style={{ flex: 1 }}>
              {jameya.name}
            </AppText>
            <Badge label={t(`jameyas.status.${jameya.status}`)} tone={jameyaStatusTone[jameya.status]} />
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: spacing.md }}>
            <View style={{ gap: 2 }}>
              <AppText variant="label" tone="muted">
                {t('jameyas.list.pot')}
              </AppText>
              <MoneyText minorUnits={jameya.potAmount} variant="heading" />
            </View>
            <View style={{ gap: 2, flexShrink: 1 }}>
              <AppText variant="label" tone="muted" align={logicalTextAlign.end}>
                {t('jameyas.list.nextCycle')}
              </AppText>
              <AppText variant="caption" numberOfLines={1} align={logicalTextAlign.end}>
                {jameya.nextCycle
                  ? `${t('jameyas.list.nextCycleValue', { sequence: formatNumber(jameya.nextCycle.sequence, locale) })} · ${formatCalendarDate(jameya.nextCycle.dueDate, locale)}`
                  : '—'}
              </AppText>
            </View>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: spacing.sm }}>
            <AppText variant="caption" tone="muted">
              {t('jameyas.new.memberCount', { count: formatNumber(jameya.shareCount, locale) })}
            </AppText>
            {jameya.lateDueCount > 0 ? (
              <Badge
                label={t('jameyas.list.lateCount', { count: formatNumber(jameya.lateDueCount, locale) })}
                tone="danger"
              />
            ) : null}
          </View>
        </View>
      </Card>
    </PressableScale>
  );
}
