import { View } from 'react-native';
import { JameyaCycle, JameyaDetail } from '@/api/jameyas';
import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useI18n } from '@/i18n/i18n-context';
import { formatCalendarDate, formatMoney, formatNumber } from '@/lib/format';
import { canHandOverCycle, findCurrentTurn } from '@/lib/jameya';
import { useTheme } from '@/theme/theme-context';
import { radius, spacing } from '@/theme/tokens';
import { JameyaTurnHolders, useTurnHoldersLabel } from './jameya-turn-holders';

const FULL_PERCENT = 100;
const PROGRESS_HEIGHT = 8;

interface JameyaCurrentTurnCardProps {
  jameya: JameyaDetail;
  canManage: boolean;
  onHandOver: (cycle: JameyaCycle, customerId: string) => void;
}

export function JameyaCurrentTurnCard({ jameya, canManage, onHandOver }: JameyaCurrentTurnCardProps) {
  const { t, locale } = useI18n();
  const { colors } = useTheme();
  const holdersLabel = useTurnHoldersLabel(jameya);
  const cycle = findCurrentTurn(jameya);

  if (!cycle) {
    return (
      <Card>
        <AppText variant="caption" tone="muted">
          {t('jameyas.detail.allHandedOver')}
        </AppText>
      </Card>
    );
  }

  const holderName = holdersLabel(cycle);
  const isShared = cycle.holders.length > 1;
  const missingAmount = Math.max(0, cycle.potAmount - cycle.collectedAmount);
  const collectedPercent = Math.min(FULL_PERCENT, (cycle.collectedAmount / cycle.potAmount) * FULL_PERCENT);

  return (
    <Card>
      <View style={{ gap: spacing.lg }}>
        <View style={{ gap: spacing.xs }}>
          <AppText variant="caption" tone="muted">
            {t('jameyas.detail.turnOn', {
              sequence: formatNumber(cycle.sequence, locale),
              date: formatCalendarDate(cycle.dueDate, locale),
            })}
          </AppText>
          <AppText variant="title">
            {t(isShared ? 'jameyas.detail.sharedTurnGets' : 'jameyas.detail.holderGets', {
              name: holderName,
              amount: formatMoney(cycle.potAmount, locale),
            })}
          </AppText>
        </View>

        {isShared ? (
          <JameyaTurnHolders jameya={jameya} cycle={cycle} canManage={canManage} onHandOver={onHandOver} />
        ) : null}

        <View style={{ gap: spacing.xs }}>
          <View
            accessibilityRole="progressbar"
            accessibilityValue={{ min: 0, max: cycle.potAmount, now: cycle.collectedAmount }}
            style={{ height: PROGRESS_HEIGHT, borderRadius: radius.full, backgroundColor: colors.surfaceMuted, overflow: 'hidden' }}
          >
            <View style={{ height: '100%', width: `${collectedPercent}%`, backgroundColor: colors.primary }} />
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: spacing.md }}>
            <AppText variant="caption">
              {t('jameyas.detail.collectedAmount', { amount: formatMoney(cycle.collectedAmount, locale) })}
            </AppText>
            {missingAmount > 0 ? (
              <AppText variant="caption" tone="muted">
                {t('jameyas.detail.missingAmount', { amount: formatMoney(missingAmount, locale) })}
              </AppText>
            ) : null}
          </View>
        </View>

        {cycle.exposureAmount > 0 ? (
          <AppText variant="caption" tone="muted">
            {t('jameyas.detail.shopPaid', { amount: formatMoney(cycle.exposureAmount, locale) })}
          </AppText>
        ) : null}

        {!isShared && canManage && canHandOverCycle(jameya, cycle) ? (
          <Button
            variant="secondary"
            icon="hand-left-outline"
            title={t('jameyas.detail.handOverTo', { name: holderName })}
            onPress={() => onHandOver(cycle, cycle.holders[0].customerId)}
          />
        ) : null}
      </View>
    </Card>
  );
}
