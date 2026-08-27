import { ReactNode } from 'react';
import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useI18n } from '@/i18n/i18n-context';
import { useTheme } from '@/theme/theme-context';
import { spacing, touchTarget } from '@/theme/tokens';
import { AppText } from './app-text';
import { PressableScale } from './pressable-scale';

interface ListRowProps {
  title: string;
  subtitle?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  trailing?: ReactNode;
  onPress?: () => void;
  showChevron?: boolean;
  destructive?: boolean;
}

export function ListRow({
  title,
  subtitle,
  icon,
  trailing,
  onPress,
  showChevron = false,
  destructive = false,
}: ListRowProps) {
  const { colors } = useTheme();
  const { isRTL } = useI18n();

  const content = (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
        minHeight: touchTarget.minHeight + 8,
        paddingVertical: spacing.sm,
      }}
    >
      {icon ? (
        <Ionicons name={icon} size={20} color={destructive ? colors.danger : colors.textMuted} />
      ) : null}
      <View style={{ flex: 1, gap: 2 }}>
        <AppText tone={destructive ? 'danger' : 'default'}>{title}</AppText>
        {subtitle ? (
          <AppText variant="caption" tone="muted">
            {subtitle}
          </AppText>
        ) : null}
      </View>
      {trailing}
      {showChevron ? (
        <Ionicons name={isRTL ? 'chevron-back' : 'chevron-forward'} size={18} color={colors.textFaint} />
      ) : null}
    </View>
  );

  if (!onPress) {
    return content;
  }
  return (
    <PressableScale onPress={onPress} accessibilityRole="button">
      {content}
    </PressableScale>
  );
}
