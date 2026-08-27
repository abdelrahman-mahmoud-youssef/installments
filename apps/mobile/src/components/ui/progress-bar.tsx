import { View } from 'react-native';
import { useTheme } from '@/theme/theme-context';
import { radius } from '@/theme/tokens';

interface ProgressBarProps {
  ratio: number;
  tone?: 'primary' | 'danger' | 'warning';
  height?: number;
}

export function ProgressBar({ ratio, tone = 'primary', height = 8 }: ProgressBarProps) {
  const { colors } = useTheme();
  const clamped = Math.min(1, Math.max(0, ratio));
  const fillColor = { primary: colors.primary, danger: colors.danger, warning: colors.warning }[tone];
  return (
    <View
      style={{
        height,
        borderRadius: radius.full,
        backgroundColor: colors.surfaceMuted,
        overflow: 'hidden',
      }}
    >
      <View
        style={{
          width: `${clamped * 100}%`,
          height: '100%',
          borderRadius: radius.full,
          backgroundColor: fillColor,
        }}
      />
    </View>
  );
}
