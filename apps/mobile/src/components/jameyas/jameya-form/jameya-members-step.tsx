import { Ionicons } from '@expo/vector-icons';
import { View } from 'react-native';
import { AppText } from '@/components/ui/app-text';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { PressableScale } from '@/components/ui/pressable-scale';
import { useI18n } from '@/i18n/i18n-context';
import { formatNumber, isolateLtr } from '@/lib/format';
import { useTheme } from '@/theme/theme-context';
import { spacing } from '@/theme/tokens';
import { JAMEYA_MAX_TURNS, JAMEYA_MIN_TURNS } from '../jameya-limits';
import { WizardMember, WizardMemberTurns } from '@/lib/jameya-wizard';

interface JameyaMembersStepProps {
  memberTurns: WizardMemberTurns[];
  turnCount: number;
  hasEnoughMembers: boolean;
  onAddCustomer: () => void;
  onAddTurn: (member: WizardMember) => void;
  onRemoveTurn: (customerId: string) => void;
}

function TurnButton({
  icon,
  label,
  disabled,
  onPress,
}: {
  icon: 'add-circle-outline' | 'remove-circle-outline';
  label: string;
  disabled: boolean;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  return (
    <PressableScale
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      hitSlop={spacing.xs}
      style={{ opacity: disabled ? 0.3 : 1 }}
    >
      <Ionicons name={icon} size={24} color={colors.primary} />
    </PressableScale>
  );
}

export function JameyaMembersStep({
  memberTurns,
  turnCount,
  hasEnoughMembers,
  onAddCustomer,
  onAddTurn,
  onRemoveTurn,
}: JameyaMembersStepProps) {
  const { t, locale } = useI18n();
  return (
    <View style={{ gap: spacing.lg }}>
      <AppText variant="caption" tone="muted">
        {t('jameyas.new.membersHint', {
          min: formatNumber(JAMEYA_MIN_TURNS, locale),
          max: formatNumber(JAMEYA_MAX_TURNS, locale),
        })}
      </AppText>
      <Button variant="secondary" icon="person-add-outline" title={t('jameyas.new.addMember')} onPress={onAddCustomer} />
      <Card>
        {memberTurns.length === 0 ? (
          <AppText variant="caption" tone="muted">
            {t('jameyas.new.noMembers')}
          </AppText>
        ) : (
          <View style={{ gap: spacing.md }}>
            {memberTurns.map(({ member, count }) => (
              <View key={member.id} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
                <View style={{ flex: 1, gap: 2 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                    <AppText variant="bodyStrong" numberOfLines={1} style={{ flexShrink: 1 }}>
                      {member.name}
                    </AppText>
                    {count > 1 ? (
                      <Badge label={t('jameyas.new.turnsBadge', { count: formatNumber(count, locale) })} tone="primary" />
                    ) : null}
                  </View>
                  <AppText variant="caption" tone="muted">
                    {isolateLtr(member.phone)}
                  </AppText>
                </View>
                <TurnButton
                  icon="add-circle-outline"
                  label={t('jameyas.new.addTurn', { name: member.name })}
                  disabled={turnCount >= JAMEYA_MAX_TURNS}
                  onPress={() => onAddTurn(member)}
                />
                <TurnButton
                  icon="remove-circle-outline"
                  label={t('jameyas.new.removeTurn', { name: member.name })}
                  disabled={false}
                  onPress={() => onRemoveTurn(member.id)}
                />
              </View>
            ))}
          </View>
        )}
      </Card>
      <AppText variant="caption" tone="muted">
        {`${t('jameyas.new.memberCount', { count: formatNumber(memberTurns.length, locale) })} · ${t('jameyas.new.turnCount', { count: formatNumber(turnCount, locale) })}`}
      </AppText>
      {turnCount > 0 && !hasEnoughMembers ? (
        <AppText variant="caption" tone="danger">
          {t('jameyas.new.minMembers')}
        </AppText>
      ) : null}
    </View>
  );
}
