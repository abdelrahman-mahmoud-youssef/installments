import { View } from 'react-native';
import { JameyaCycle, JameyaDetail } from '@/api/jameyas';
import { AppText } from '@/components/ui/app-text';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { PressableScale } from '@/components/ui/pressable-scale';
import { useI18n } from '@/i18n/i18n-context';
import { formatCalendarDate, formatMoney, formatNumber } from '@/lib/format';
import {
  canHandOverCycle,
  currentJameyaCycle,
  dueCellKey,
  dueCellKind,
  duesByCell,
  jameyaCycleStateTone,
  jameyaDueCellTone,
  jameyaMemberName,
} from '@/lib/jameya';
import { spacing } from '@/theme/tokens';
import { JameyaCycleFigures } from './jameya-cycle-figures';
import { JameyaReminderButton } from './jameya-reminder-button';

interface JameyaCurrentCycleCardProps {
  jameya: JameyaDetail;
  canManage: boolean;
  onRecordPayment: (customerId: string) => void;
  onHandOver: (cycle: JameyaCycle) => void;
}

export function JameyaCurrentCycleCard({ jameya, canManage, onRecordPayment, onHandOver }: JameyaCurrentCycleCardProps) {
  const { t, locale } = useI18n();
  const cycle = currentJameyaCycle(jameya);

  if (!cycle) {
    return (
      <Card>
        <AppText variant="caption" tone="muted">
          {t('jameyas.detail.allSettled')}
        </AppText>
      </Card>
    );
  }

  const dues = duesByCell(jameya.dues);
  const isActive = jameya.status === 'ACTIVE';
  const holderNames = cycle.holders.map((holder) => jameyaMemberName(jameya, holder.customerId)).join(' · ');

  return (
    <Card>
      <View style={{ gap: spacing.lg }}>
        <View style={{ gap: spacing.xs }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: spacing.sm }}>
            <AppText variant="heading">
              {t('jameyas.detail.currentCycleTitle', { sequence: formatNumber(cycle.sequence, locale) })}
            </AppText>
            <Badge label={t(`jameyas.cycleState.${cycle.state}`)} tone={jameyaCycleStateTone[cycle.state]} />
          </View>
          <AppText variant="caption" tone="muted">
            {`${t('jameyas.detail.dueOn')} ${formatCalendarDate(cycle.dueDate, locale)} · ${t('jameyas.detail.holderIs', { name: holderNames })}`}
          </AppText>
        </View>

        <JameyaCycleFigures cycle={cycle} />

        <View>
          {jameya.members.map((member) => {
            const due = dues.get(dueCellKey(cycle.id, member.customerId));
            const kind = due ? dueCellKind(due, cycle) : null;
            const canPay = isActive && member.remainingAmount > 0;
            return (
              <View
                key={member.customerId}
                style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.sm }}
              >
                <PressableScale
                  onPress={() => onRecordPayment(member.customerId)}
                  disabled={!canPay}
                  accessibilityRole="button"
                  accessibilityLabel={`${t('jameyas.detail.recordPayment')} ${member.name}`}
                  style={{ flex: 1, gap: 2 }}
                >
                  <AppText variant="bodyStrong" numberOfLines={1}>
                    {member.name}
                  </AppText>
                  {due ? (
                    <AppText variant="caption" tone="muted">
                      {t('jameyas.grid.cellTitle', {
                        paid: formatMoney(due.paidAmount, locale),
                        amount: formatMoney(due.amount, locale),
                      })}
                    </AppText>
                  ) : null}
                </PressableScale>
                {kind ? <Badge label={t(`jameyas.grid.cell.${kind}`)} tone={jameyaDueCellTone[kind]} /> : null}
                <JameyaReminderButton member={member} />
              </View>
            );
          })}
        </View>

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
