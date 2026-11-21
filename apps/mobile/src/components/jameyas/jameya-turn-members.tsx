import { View } from 'react-native';
import { JameyaCycle, JameyaDetail, JameyaMember } from '@/api/jameyas';
import { AppText } from '@/components/ui/app-text';
import { Badge } from '@/components/ui/badge';
import { PressableScale } from '@/components/ui/pressable-scale';
import { useI18n } from '@/i18n/i18n-context';
import { formatMoney } from '@/lib/format';
import { dueCellKind, JameyaDueCellKind } from '@/lib/jameya';
import { useTheme } from '@/theme/theme-context';
import { radius, spacing } from '@/theme/tokens';
import { JameyaReminderButton } from './jameya-reminder-button';

const DUE_KIND_TONE: Record<JameyaDueCellKind, 'success' | 'danger' | 'muted'> = {
  paid: 'success',
  partial: 'muted',
  late: 'danger',
  due: 'muted',
  upcoming: 'muted',
};

interface JameyaTurnMembersProps {
  jameya: JameyaDetail;
  cycle: JameyaCycle;
  onOpenMember: (customerId: string) => void;
  onCollect?: (member: JameyaMember) => void;
}

export function JameyaTurnMembers({ jameya, cycle, onOpenMember, onCollect }: JameyaTurnMembersProps) {
  const { t, locale } = useI18n();
  const { colors } = useTheme();
  const holderIds = new Set(cycle.holders.map((holder) => holder.customerId));
  const dueOf = (customerId: string) =>
    jameya.dues.find((due) => due.cycleId === cycle.id && due.customerId === customerId);
  const owedThisTurnOf = (customerId: string) => {
    const due = dueOf(customerId);
    return due ? due.amount - due.paidAmount : 0;
  };
  const sortRank = (customerId: string) =>
    (owedThisTurnOf(customerId) > 0 ? 0 : 2) + (holderIds.has(customerId) ? 0 : 1);
  const members = [...jameya.members].sort((first, second) => sortRank(first.customerId) - sortRank(second.customerId));

  return (
    <View style={{ gap: spacing.md }}>
      {members.map((member) => {
        const due = dueOf(member.customerId);
        const kind = due ? dueCellKind(due, cycle) : null;
        const owedThisTurn = owedThisTurnOf(member.customerId);
        return (
          <View key={member.customerId} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
            <PressableScale
              onPress={() => onOpenMember(member.customerId)}
              accessibilityRole="button"
              style={{ flex: 1, gap: 2 }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                <AppText variant="bodyStrong" numberOfLines={1} style={{ flexShrink: 1 }}>
                  {member.name}
                </AppText>
                {holderIds.has(member.customerId) ? <Badge label={t('jameyas.detail.getsPaid')} tone="primary" /> : null}
              </View>
              {kind ? (
                <AppText variant="caption" tone={DUE_KIND_TONE[kind]}>
                  {owedThisTurn > 0
                    ? `${t(`jameyas.grid.cell.${kind}`)} · ${formatMoney(owedThisTurn, locale)}`
                    : t(`jameyas.grid.cell.${kind}`)}
                </AppText>
              ) : null}
            </PressableScale>
            {owedThisTurn > 0 ? (
              <>
                {onCollect ? (
                  <PressableScale
                    onPress={() => onCollect(member)}
                    accessibilityRole="button"
                    style={{
                      borderWidth: 1,
                      borderColor: colors.border,
                      borderRadius: radius.full,
                      paddingHorizontal: spacing.md,
                      paddingVertical: spacing.xs,
                    }}
                  >
                    <AppText variant="caption" tone="primary">
                      {t('jameyas.detail.recordShort')}
                    </AppText>
                  </PressableScale>
                ) : null}
                <JameyaReminderButton member={member} />
              </>
            ) : null}
          </View>
        );
      })}
    </View>
  );
}
