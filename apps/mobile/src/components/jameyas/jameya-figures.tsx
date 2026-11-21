import { View } from 'react-native';
import { AppText } from '@/components/ui/app-text';
import { MoneyText } from '@/components/ui/money-text';
import { useTheme } from '@/theme/theme-context';
import { radius, spacing } from '@/theme/tokens';

export interface JameyaFigure {
  label: string;
  minorUnits: number;
  tone?: 'success' | 'warning';
}

export function JameyaFigures({ figures }: { figures: JameyaFigure[] }) {
  const { colors } = useTheme();
  return (
    <View style={{ gap: spacing.sm, backgroundColor: colors.surfaceMuted, borderRadius: radius.md, padding: spacing.md }}>
      {figures.map((figure) => (
        <View
          key={figure.label}
          style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md }}
        >
          <AppText variant="caption" tone="muted" style={{ flexShrink: 1 }}>
            {figure.label}
          </AppText>
          <MoneyText minorUnits={figure.minorUnits} variant="bodyStrong" tone={figure.tone} />
        </View>
      ))}
    </View>
  );
}
