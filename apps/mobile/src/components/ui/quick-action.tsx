import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme/theme-context';
import { radius, spacing, touchTarget } from '@/theme/tokens';
import { AppText } from './app-text';
import { PressableScale } from './pressable-scale';

const DISABLED_OPACITY = 0.4;

interface QuickActionProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress?: () => void;
}

export function QuickAction({ icon, label, onPress }: QuickActionProps) {
  const { colors } = useTheme();
  const isDisabled = !onPress;
  return (
    <PressableScale
      onPress={onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: isDisabled }}
      style={{
        alignItems: 'center',
        gap: spacing.xs,
        minWidth: touchTarget.minHeight + spacing.lg,
        opacity: isDisabled ? DISABLED_OPACITY : 1,
      }}
    >
      <View
        style={{
          width: touchTarget.minHeight + spacing.xs,
          height: touchTarget.minHeight + spacing.xs,
          borderRadius: radius.full,
          backgroundColor: colors.primaryMuted,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Ionicons name={icon} size={20} color={colors.primary} />
      </View>
      <AppText variant="label" tone="primary">
        {label}
      </AppText>
    </PressableScale>
  );
}
