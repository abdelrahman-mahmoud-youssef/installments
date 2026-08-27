import { ReactNode } from 'react';
import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/theme/theme-context';
import { radius, spacing, touchTarget } from '@/theme/tokens';
import { AppText } from './app-text';
import { PressableScale } from './pressable-scale';

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  actionIcon?: keyof typeof Ionicons.glyphMap;
  actionLabel?: string;
  onAction?: () => void;
  children?: ReactNode;
}

export function ScreenHeader({
  title,
  subtitle,
  actionIcon,
  actionLabel,
  onAction,
  children,
}: ScreenHeaderProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <View
      style={{
        paddingTop: insets.top + spacing.md,
        paddingHorizontal: spacing.xl,
        paddingBottom: spacing.md,
        gap: spacing.md,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={{ flex: 1, gap: 2 }}>
          <AppText variant="largeTitle">{title}</AppText>
          {subtitle ? (
            <AppText variant="caption" tone="muted">
              {subtitle}
            </AppText>
          ) : null}
        </View>
        {actionIcon && onAction ? (
          <PressableScale
            onPress={onAction}
            accessibilityRole="button"
            accessibilityLabel={actionLabel ?? title}
            style={{
              width: touchTarget.minHeight,
              height: touchTarget.minHeight,
              borderRadius: radius.full,
              backgroundColor: colors.primary,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons name={actionIcon} size={22} color={colors.onPrimary} />
          </PressableScale>
        ) : null}
      </View>
      {children}
    </View>
  );
}
