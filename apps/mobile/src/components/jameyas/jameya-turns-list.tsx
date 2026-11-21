import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { View } from 'react-native';
import { JameyaCycle, JameyaDetail } from '@/api/jameyas';
import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { MoneyText } from '@/components/ui/money-text';
import { PressableScale } from '@/components/ui/pressable-scale';
import { useI18n } from '@/i18n/i18n-context';
import { formatCalendarDate, formatMoney, formatNumber } from '@/lib/format';
import {
  canHandOverCycle,
  findCurrentTurn,
  holderNamesOf,
  jameyaMemberName,
  JameyaTurnStatus,
  payoutsWithRemaining,
  resolveTurnStatus,
  turnsAroundCurrent,
} from '@/lib/jameya';
import { useTheme } from '@/theme/theme-context';
import { radius, spacing } from '@/theme/tokens';
import { JameyaReceiptIconButton } from './jameya-receipt-icon-button';
import { JameyaTurnMembers } from './jameya-turn-members';
import { useShareJameyaReceipt } from './use-share-jameya-receipt';

type HandOver = (cycle: JameyaCycle) => void;

function TurnStatusText({ status }: { status: JameyaTurnStatus }) {
  const { t, locale } = useI18n();
  if (status.kind === 'partlyPaidOut') {
    return (
      <AppText variant="caption" tone="muted">
        {t('jameyas.detail.turnStatus.partlyPaidOut', {
          paid: formatMoney(status.paidOutAmount, locale),
          owed: formatMoney(status.owedAmount, locale),
        })}
      </AppText>
    );
  }
  return (
    <AppText variant="caption" tone={status.kind === 'current' ? 'primary' : 'muted'}>
      {t(`jameyas.detail.turnStatus.${status.kind}`)}
    </AppText>
  );
}

function TurnPayouts({ jameya, cycle, canManage, onHandOver, onOpenMember }: TurnRowProps) {
  const { t, locale } = useI18n();
  const { colors } = useTheme();
  const { sharePayoutReceipt, canShare } = useShareJameyaReceipt(jameya.name);

  return (
    <View style={{ gap: spacing.md, backgroundColor: colors.surfaceMuted, borderRadius: radius.md, padding: spacing.md }}>
      <JameyaTurnMembers jameya={jameya} cycle={cycle} onOpenMember={onOpenMember} />
      {cycle.payouts.length === 0 ? (
        <AppText variant="caption" tone="muted">
          {t('jameyas.detail.noPayouts')}
        </AppText>
      ) : (
        payoutsWithRemaining(cycle).map(({ payout, remainingAmount }) => {
          const holderName = jameyaMemberName(jameya, payout.customerId);
          return (
            <View key={payout.id} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
              <View style={{ flex: 1, gap: 2 }}>
                <AppText variant="caption">{formatCalendarDate(payout.paidAt, locale)}</AppText>
                {payout.note ? (
                  <AppText variant="caption" tone="muted">
                    {payout.note}
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
        })
      )}
      {canManage && canHandOverCycle(jameya, cycle) ? (
        <Button
          variant="secondary"
          icon="hand-left-outline"
          title={t('jameyas.detail.handOverPayout')}
          onPress={() => onHandOver(cycle)}
        />
      ) : null}
    </View>
  );
}

interface TurnRowProps {
  jameya: JameyaDetail;
  cycle: JameyaCycle;
  canManage: boolean;
  onHandOver: HandOver;
  onOpenMember: (customerId: string) => void;
}

function TurnRow({ status, ...props }: TurnRowProps & { status: JameyaTurnStatus }) {
  const { t, locale } = useI18n();
  const { colors } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const { jameya, cycle } = props;

  return (
    <View style={{ gap: spacing.sm }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
        <AppText variant="caption" tone="muted" style={{ minWidth: 20 }}>
          {formatNumber(cycle.sequence, locale)}
        </AppText>
        <PressableScale
          onPress={() => props.onOpenMember(cycle.holders[0].customerId)}
          accessibilityRole="button"
          style={{ flex: 1 }}
        >
          <AppText variant="bodyStrong" numberOfLines={1}>
            {holderNamesOf(jameya, cycle)}
          </AppText>
        </PressableScale>
        <PressableScale
          onPress={() => setIsOpen((current) => !current)}
          accessibilityRole="button"
          accessibilityState={{ expanded: isOpen }}
          accessibilityLabel={t('jameyas.detail.turnDetails', { sequence: formatNumber(cycle.sequence, locale) })}
          style={{ alignItems: 'flex-end', gap: 2 }}
        >
          <TurnStatusText status={status} />
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
            <AppText variant="label" tone="muted">
              {formatCalendarDate(cycle.dueDate, locale)}
            </AppText>
            <Ionicons name={isOpen ? 'chevron-up' : 'chevron-down'} size={14} color={colors.textMuted} />
          </View>
        </PressableScale>
      </View>
      {isOpen ? <TurnPayouts {...props} /> : null}
    </View>
  );
}

export function JameyaTurnsList(props: Omit<TurnRowProps, 'cycle'>) {
  const { t } = useI18n();
  const [showAll, setShowAll] = useState(false);
  const current = findCurrentTurn(props.jameya);
  const nearby = turnsAroundCurrent(props.jameya);
  const cycles = showAll ? props.jameya.cycles : nearby;

  return (
    <Card>
      <View style={{ gap: spacing.md }}>
        {cycles.map((cycle) => (
          <TurnRow
            key={cycle.id}
            {...props}
            cycle={cycle}
            status={resolveTurnStatus(cycle, current)}
          />
        ))}
        {nearby.length < props.jameya.cycles.length ? (
          <Button
            variant="ghost"
            title={showAll ? t('jameyas.detail.showFewerTurns') : t('jameyas.detail.showAllTurns')}
            onPress={() => setShowAll((value) => !value)}
          />
        ) : null}
      </View>
    </Card>
  );
}
