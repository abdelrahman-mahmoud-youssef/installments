import { Linking, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { OverdueCustomerSummary } from '@/api/reports';
import { AppText } from '@/components/ui/app-text';
import { MoneyText } from '@/components/ui/money-text';
import { PressableScale } from '@/components/ui/pressable-scale';
import { useI18n } from '@/i18n/i18n-context';
import { formatNumber } from '@/lib/format';
import { useTheme } from '@/theme/theme-context';
import { radius, spacing, touchTarget } from '@/theme/tokens';

interface OverdueCustomerRowProps {
  customer: OverdueCustomerSummary;
  onPress: () => void;
  isLast: boolean;
}

export function OverdueCustomerRow({ customer, onPress, isLast }: OverdueCustomerRowProps) {
  const { t, locale } = useI18n();
  const { colors } = useTheme();

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
        borderBottomWidth: isLast ? 0 : 1,
        borderBottomColor: colors.border,
      }}
    >
      <PressableScale onPress={onPress} accessibilityRole="button" style={{ flex: 1 }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: spacing.md,
            minHeight: touchTarget.minHeight + spacing.sm,
            paddingVertical: spacing.sm,
          }}
        >
          <View style={{ flex: 1, gap: 2 }}>
            <AppText variant="bodyStrong" numberOfLines={1}>
              {customer.customerName}
            </AppText>
            <AppText variant="caption" tone="muted" numberOfLines={1}>
              {t('reports.overdueInstallments', { count: formatNumber(customer.overdueInstallmentCount, locale) })}
            </AppText>
          </View>
          <MoneyText minorUnits={customer.overdueBalance} variant="bodyStrong" tone="danger" />
        </View>
      </PressableScale>
      <PressableScale
        onPress={() => void Linking.openURL(`tel:${customer.customerPhone}`)}
        accessibilityRole="button"
        accessibilityLabel={t('reports.call', { name: customer.customerName })}
        style={{
          width: touchTarget.minHeight,
          height: touchTarget.minHeight,
          borderRadius: radius.full,
          backgroundColor: colors.primaryMuted,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Ionicons name="call" size={18} color={colors.primary} />
      </PressableScale>
    </View>
  );
}
