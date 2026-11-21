import { Ionicons } from '@expo/vector-icons';
import { View } from 'react-native';
import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { PressableScale } from '@/components/ui/pressable-scale';
import { useI18n } from '@/i18n/i18n-context';
import { formatNumber } from '@/lib/format';
import { useTheme } from '@/theme/theme-context';
import { spacing } from '@/theme/tokens';
import { JameyaFormMember } from './use-jameya-form';

interface JameyaOrderStepProps {
  members: JameyaFormMember[];
  onMove: (from: number, to: number) => void;
  onShuffle: () => void;
}

interface MoveButtonProps {
  icon: 'chevron-up' | 'chevron-down';
  label: string;
  disabled: boolean;
  onPress: () => void;
}

function MoveButton({ icon, label, disabled, onPress }: MoveButtonProps) {
  const { colors } = useTheme();
  return (
    <PressableScale
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      hitSlop={spacing.xs}
      style={{ padding: spacing.xs, opacity: disabled ? 0.3 : 1 }}
    >
      <Ionicons name={icon} size={22} color={colors.primary} />
    </PressableScale>
  );
}

export function JameyaOrderStep({ members, onMove, onShuffle }: JameyaOrderStepProps) {
  const { t, locale } = useI18n();
  return (
    <View style={{ gap: spacing.lg }}>
      <AppText variant="caption" tone="muted">
        {t('jameyas.new.orderHint')}
      </AppText>
      <Button variant="secondary" icon="shuffle-outline" title={t('jameyas.new.randomOrder')} onPress={onShuffle} />
      <Card>
        <View style={{ gap: spacing.sm }}>
          {members.map((member, index) => (
            <View key={member.id} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
              <AppText variant="caption" tone="muted" style={{ minWidth: 64 }}>
                {t('jameyas.new.turnNumber', { sequence: formatNumber(index + 1, locale) })}
              </AppText>
              <AppText variant="bodyStrong" numberOfLines={1} style={{ flex: 1 }}>
                {member.name}
              </AppText>
              <MoveButton
                icon="chevron-up"
                label={t('jameyas.new.moveUp', { name: member.name })}
                disabled={index === 0}
                onPress={() => onMove(index, index - 1)}
              />
              <MoveButton
                icon="chevron-down"
                label={t('jameyas.new.moveDown', { name: member.name })}
                disabled={index === members.length - 1}
                onPress={() => onMove(index, index + 1)}
              />
            </View>
          ))}
        </View>
      </Card>
    </View>
  );
}
