import { ActivityIndicator, StyleProp, View, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme/theme-context';
import { radius, spacing, touchTarget } from '@/theme/tokens';
import { AppText } from './app-text';
import { PressableScale } from './pressable-scale';

type ButtonVariant = 'primary' | 'secondary' | 'destructive' | 'ghost';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  icon?: keyof typeof Ionicons.glyphMap;
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  icon,
  loading = false,
  disabled = false,
  style,
}: ButtonProps) {
  const { colors, fontSize } = useTheme();

  const background: Record<ButtonVariant, string> = {
    primary: colors.primary,
    secondary: colors.surfaceMuted,
    destructive: colors.dangerMuted,
    ghost: 'transparent',
  };
  const foreground: Record<ButtonVariant, string> = {
    primary: colors.onPrimary,
    secondary: colors.text,
    destructive: colors.danger,
    ghost: colors.primary,
  };
  const isBlocked = disabled || loading;

  return (
    <PressableScale
      onPress={onPress}
      disabled={isBlocked}
      accessibilityRole="button"
      accessibilityLabel={title}
      style={[
        {
          backgroundColor: background[variant],
          borderRadius: radius.md,
          minHeight: touchTarget.minHeight + 4,
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'row',
          gap: spacing.sm,
          paddingHorizontal: spacing.xl,
          opacity: isBlocked ? 0.6 : 1,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={foreground[variant]} />
      ) : (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
          {icon ? <Ionicons name={icon} size={fontSize('lg')} color={foreground[variant]} /> : null}
          <AppText variant="bodyStrong" style={{ color: foreground[variant] }}>
            {title}
          </AppText>
        </View>
      )}
    </PressableScale>
  );
}
