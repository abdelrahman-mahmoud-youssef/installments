import { View } from 'react-native';
import { DashboardPaymentSummary } from '@/api/dashboard';
import { AppText } from '@/components/ui/app-text';
import { MoneyText } from '@/components/ui/money-text';
import { PressableScale } from '@/components/ui/pressable-scale';
import { useI18n } from '@/i18n/i18n-context';
import { formatDateTime } from '@/lib/format';
import { useTheme } from '@/theme/theme-context';
import { spacing, touchTarget } from '@/theme/tokens';

interface RecentPaymentRowProps {
  payment: DashboardPaymentSummary;
  onPress: () => void;
  isLast: boolean;
}

export function RecentPaymentRow({ payment, onPress, isLast }: RecentPaymentRowProps) {
  const { locale } = useI18n();
  const { colors } = useTheme();

  return (
    <PressableScale onPress={onPress} accessibilityRole="button">
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.md,
          minHeight: touchTarget.minHeight + spacing.sm,
          paddingVertical: spacing.sm,
          borderBottomWidth: isLast ? 0 : 1,
          borderBottomColor: colors.border,
        }}
      >
        <View style={{ flex: 1, gap: 2 }}>
          <AppText variant="bodyStrong" numberOfLines={1}>
            {payment.customerName}
          </AppText>
          <AppText variant="label" tone="faint">
            {formatDateTime(payment.paidAt, locale)}
          </AppText>
        </View>
        <MoneyText minorUnits={payment.amount} variant="bodyStrong" tone="success" />
      </View>
    </PressableScale>
  );
}
