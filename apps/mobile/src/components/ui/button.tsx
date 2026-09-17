import { ActivityIndicator, StyleProp, View, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme/theme-context';
import { radius, spacing, touchTarget } from '@/theme/tokens';
import { AppText } from './app-text';
import { GlassSurface } from './glass-surface';
import { PressableScale } from './pressable-scale';

type ButtonVariant = 'primary' | 'secondary' | 'destructive' | 'ghost' | 'glass';

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
    glass: colors.primary,
  };
  const foreground: Record<ButtonVariant, string> = {
    primary: colors.onPrimary,
    secondary: colors.text,
    destructive: colors.danger,
    ghost: colors.primary,
    glass: colors.onPrimary,
  };
  const isBlocked = disabled || loading;

  const surfaceStyle: ViewStyle = {
    borderRadius: radius.md,
    minHeight: touchTarget.minHeight + 4,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
    opacity: isBlocked ? 0.6 : 1,
  };

  const label = loading ? (
    <ActivityIndicator color={foreground[variant]} />
  ) : (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
      {icon ? <Ionicons name={icon} size={fontSize('lg')} color={foreground[variant]} /> : null}
      <AppText variant="bodyStrong" style={{ color: foreground[variant] }}>
        {title}
      </AppText>
    </View>
  );

  return (
    <PressableScale
      onPress={onPress}
      disabled={isBlocked}
      accessibilityRole="button"
      accessibilityLabel={title}
      style={style}
    >
      {variant === 'glass' ? (
        <GlassSurface tint={colors.primary} interactive fallbackColor={background.glass} style={surfaceStyle}>
          {label}
        </GlassSurface>
      ) : (
        <View style={[surfaceStyle, { backgroundColor: background[variant] }]}>{label}</View>
      )}
    </PressableScale>
  );
}
