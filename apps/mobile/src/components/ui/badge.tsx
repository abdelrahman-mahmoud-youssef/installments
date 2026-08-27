import { View } from 'react-native';
import { useTheme } from '@/theme/theme-context';
import { radius, spacing } from '@/theme/tokens';
import { AppText } from './app-text';

export type BadgeTone = 'success' | 'danger' | 'warning' | 'info' | 'neutral' | 'primary';

interface BadgeProps {
  label: string;
  tone?: BadgeTone;
}

export function Badge({ label, tone = 'neutral' }: BadgeProps) {
  const { colors } = useTheme();
  const palette: Record<BadgeTone, { background: string; foreground: string }> = {
    success: { background: colors.successMuted, foreground: colors.success },
    danger: { background: colors.dangerMuted, foreground: colors.danger },
    warning: { background: colors.warningMuted, foreground: colors.warning },
    info: { background: colors.infoMuted, foreground: colors.info },
    neutral: { background: colors.surfaceMuted, foreground: colors.textMuted },
    primary: { background: colors.primaryMuted, foreground: colors.primary },
  };
  const { background, foreground } = palette[tone];
  return (
    <View
      style={{
        backgroundColor: background,
        borderRadius: radius.full,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.xs,
        alignSelf: 'flex-start',
      }}
    >
      <AppText variant="label" style={{ color: foreground }}>
        {label}
      </AppText>
    </View>
  );
}
