import { View } from 'react-native';
import { DashboardInstallmentSummary } from '@/api/dashboard';
import { AppText } from '@/components/ui/app-text';
import { MoneyText } from '@/components/ui/money-text';
import { PressableScale } from '@/components/ui/pressable-scale';
import { useI18n } from '@/i18n/i18n-context';
import { formatDate, formatNumber } from '@/lib/format';
import { useTheme } from '@/theme/theme-context';
import { spacing, touchTarget } from '@/theme/tokens';

interface InstallmentRowProps {
  installment: DashboardInstallmentSummary;
  onPress: () => void;
  showDueDate?: boolean;
  isLast?: boolean;
}

export function InstallmentRow({ installment, onPress, showDueDate = false, isLast = false }: InstallmentRowProps) {
  const { t, locale } = useI18n();
  const { colors } = useTheme();
  const remaining = installment.amount - installment.paidAmount;

  return (
    <PressableScale onPress={onPress} accessibilityRole="button">
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.md,
          minHeight: touchTarget.minHeight + 8,
          paddingVertical: spacing.sm,
          borderBottomWidth: isLast ? 0 : 1,
          borderBottomColor: colors.border,
        }}
      >
        <View style={{ flex: 1, gap: 2 }}>
          <AppText variant="bodyStrong" numberOfLines={1}>
            {installment.customerName}
          </AppText>
          <AppText variant="caption" tone="muted" numberOfLines={1}>
            {installment.productName} ·{' '}
            {t('dashboard.installmentNumber', { sequence: formatNumber(installment.sequence, locale) })}
          </AppText>
          {showDueDate ? (
            <AppText variant="label" tone="faint">
              {formatDate(installment.dueDate, locale)}
            </AppText>
          ) : null}
        </View>
        <MoneyText minorUnits={remaining} variant="bodyStrong" />
      </View>
    </PressableScale>
  );
}
