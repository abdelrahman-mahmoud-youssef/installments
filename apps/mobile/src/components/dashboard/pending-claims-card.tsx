import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '@/components/ui/app-text';
import { Card } from '@/components/ui/card';
import { PressableScale } from '@/components/ui/pressable-scale';
import { useI18n } from '@/i18n/i18n-context';
import { formatNumber } from '@/lib/format';
import { useTheme } from '@/theme/theme-context';
import { spacing } from '@/theme/tokens';

interface PendingClaimsCardProps {
  count: number;
  onPress: () => void;
}

export function PendingClaimsCard({ count, onPress }: PendingClaimsCardProps) {
  const { t, locale, isRTL } = useI18n();
  const { colors } = useTheme();

  return (
    <PressableScale onPress={onPress} accessibilityRole="button">
      <Card style={{ backgroundColor: colors.warningMuted, borderColor: colors.warningMuted }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
          <Ionicons name="hourglass-outline" size={22} color={colors.warning} />
          <View style={{ flex: 1, gap: 2 }}>
            <AppText variant="bodyStrong" tone="warning">
              {formatNumber(count, locale)} {t('dashboard.pendingClaims')}
            </AppText>
            <AppText variant="caption" tone="muted">
              {t('dashboard.pendingClaimsAction')}
            </AppText>
          </View>
          <Ionicons name={isRTL ? 'chevron-back' : 'chevron-forward'} size={18} color={colors.warning} />
        </View>
      </Card>
    </PressableScale>
  );
}
