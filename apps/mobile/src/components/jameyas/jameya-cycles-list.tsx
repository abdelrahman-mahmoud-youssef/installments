import { View } from 'react-native';
import { JameyaCycle, JameyaCycleHolder, JameyaDetail } from '@/api/jameyas';
import { AppText } from '@/components/ui/app-text';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { MoneyText } from '@/components/ui/money-text';
import { useI18n } from '@/i18n/i18n-context';
import { formatCalendarDate, formatMoney, formatNumber } from '@/lib/format';
import { canHandOverCycle, jameyaCycleStateTone, jameyaMemberName, payoutsWithRemaining } from '@/lib/jameya';
import { useTheme } from '@/theme/theme-context';
import { radius, spacing } from '@/theme/tokens';
import { JameyaCycleFigures } from './jameya-cycle-figures';
import { JameyaFigures } from './jameya-figures';
import { JameyaReceiptIconButton } from './jameya-receipt-icon-button';
import { useShareJameyaReceipt } from './use-share-jameya-receipt';

interface JameyaCyclesListProps {
  jameya: JameyaDetail;
  canManage: boolean;
  onHandOver: (cycle: JameyaCycle) => void;
}

function HolderFigures({ jameya, holder }: { jameya: JameyaDetail; holder: JameyaCycleHolder }) {
  const { t } = useI18n();
  return (
    <View style={{ gap: spacing.xs }}>
      <AppText variant="caption" style={{ fontWeight: '600' }}>
        {t('jameyas.detail.holderIs', { name: jameyaMemberName(jameya, holder.customerId) })}
      </AppText>
      <JameyaFigures
        figures={[
          { label: t('jameyas.detail.entitlement'), minorUnits: holder.entitlementAmount },
          { label: t('jameyas.detail.paidOut'), minorUnits: holder.paidOutAmount },
          {
            label: t('jameyas.detail.remainingForTurn'),
            minorUnits: holder.remainingAmount,
            tone: holder.remainingAmount === 0 ? 'success' : undefined,
          },
        ]}
      />
    </View>
  );
}

function CyclePayouts({ jameya, cycle }: { jameya: JameyaDetail; cycle: JameyaCycle }) {
  const { t, locale } = useI18n();
  const { colors } = useTheme();
  const { sharePayoutReceipt, canShare } = useShareJameyaReceipt(jameya.name);

  return (
    <View style={{ gap: spacing.sm }}>
      {payoutsWithRemaining(cycle).map(({ payout, remainingAmount }) => {
        const holderName = jameyaMemberName(jameya, payout.customerId);
        return (
          <View
            key={payout.id}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: spacing.md,
              borderRadius: radius.md,
              borderWidth: 1,
              borderColor: colors.border,
              padding: spacing.md,
            }}
          >
            <View style={{ flex: 1, gap: 2 }}>
              <AppText variant="caption" style={{ fontWeight: '600' }} numberOfLines={1}>
                {`${formatCalendarDate(payout.paidAt, locale)} · ${holderName}`}
              </AppText>
              {payout.note ? (
                <AppText variant="caption" tone="muted">
                  {payout.note}
                </AppText>
              ) : null}
              {payout.coveredAmount > 0 ? (
                <AppText variant="label" tone="warning">
                  {`${t('jameyas.detail.payoutCovered')} ${formatMoney(payout.coveredAmount, locale)}`}
                </AppText>
              ) : null}
            </View>
            <MoneyText minorUnits={payout.amount} variant="bodyStrong" />
            <JameyaReceiptIconButton
              disabled={!canShare}
              onPress={() => void sharePayoutReceipt({ holderName, cycle, payout, remainingAmount })}
            />
          </View>
        );
      })}
    </View>
  );
}

function CycleCard({ jameya, cycle, canManage, onHandOver }: JameyaCyclesListProps & { cycle: JameyaCycle }) {
  const { t, locale } = useI18n();
  return (
    <Card>
      <View style={{ gap: spacing.md }}>
        <View style={{ gap: spacing.xs }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: spacing.sm }}>
            <AppText variant="bodyStrong">
              {t('jameyas.detail.turnLabel', { sequence: formatNumber(cycle.sequence, locale) })}
            </AppText>
            <Badge label={t(`jameyas.cycleState.${cycle.state}`)} tone={jameyaCycleStateTone[cycle.state]} />
          </View>
          <AppText variant="caption" tone="muted">
            {`${formatCalendarDate(cycle.dueDate, locale)} · ${t('jameyas.detail.lateAfter')} ${formatCalendarDate(cycle.lateAfter, locale)}`}
          </AppText>
        </View>
        {cycle.holders.map((holder) => (
          <HolderFigures key={holder.customerId} jameya={jameya} holder={holder} />
        ))}
        <JameyaCycleFigures cycle={cycle} />
        {cycle.payouts.length > 0 ? <CyclePayouts jameya={jameya} cycle={cycle} /> : null}
        {canManage && canHandOverCycle(jameya, cycle) ? (
          <Button
            variant="secondary"
            icon="hand-left-outline"
            title={t('jameyas.detail.handOverPayout')}
            onPress={() => onHandOver(cycle)}
          />
        ) : null}
      </View>
    </Card>
  );
}

export function JameyaCyclesList(props: JameyaCyclesListProps) {
  return (
    <View style={{ gap: spacing.md }}>
      {props.jameya.cycles.map((cycle) => (
        <CycleCard key={cycle.id} {...props} cycle={cycle} />
      ))}
    </View>
  );
}
