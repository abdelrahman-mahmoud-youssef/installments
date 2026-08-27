import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme/theme-context';
import { radius, spacing } from '@/theme/tokens';
import { AppText } from './app-text';
import { Card } from './card';

interface StatCardProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  tone?: 'primary' | 'danger' | 'info' | 'warning';
}

export function StatCard({ icon, label, value, tone = 'primary' }: StatCardProps) {
  const { colors } = useTheme();
  const palette = {
    primary: { background: colors.primaryMuted, foreground: colors.primary },
    danger: { background: colors.dangerMuted, foreground: colors.danger },
    info: { background: colors.infoMuted, foreground: colors.info },
    warning: { background: colors.warningMuted, foreground: colors.warning },
  }[tone];

  return (
    <Card style={{ flex: 1 }}>
      <View style={{ gap: spacing.md }}>
        <View
          style={{
            width: 36,
            height: 36,
            borderRadius: radius.md,
            backgroundColor: palette.background,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons name={icon} size={18} color={palette.foreground} />
        </View>
        <View style={{ gap: 2 }}>
          <AppText variant="heading" numberOfLines={1} adjustsFontSizeToFit>
            {value}
          </AppText>
          <AppText variant="label" tone="muted" numberOfLines={1}>
            {label}
          </AppText>
        </View>
      </View>
    </Card>
  );
}
