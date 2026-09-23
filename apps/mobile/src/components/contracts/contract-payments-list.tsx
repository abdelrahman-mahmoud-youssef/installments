import { View } from 'react-native';
import { ContractPayment } from '@/api/contracts';
import { AppText } from '@/components/ui/app-text';
import { Card } from '@/components/ui/card';
import { MoneyText } from '@/components/ui/money-text';
import { usePaymentMethods } from '@/hooks/queries';
import { useI18n } from '@/i18n/i18n-context';
import { formatDate } from '@/lib/format';
import { useTheme } from '@/theme/theme-context';
import { spacing } from '@/theme/tokens';

interface ContractPaymentsListProps {
  payments: ContractPayment[];
  canSeeWallets: boolean;
}

export function ContractPaymentsList({ payments, canSeeWallets }: ContractPaymentsListProps) {
  const { t, locale } = useI18n();
  const { colors } = useTheme();
  const { data: paymentMethods } = usePaymentMethods(canSeeWallets);

  const methodLabel = (paymentMethodId: string | null) =>
    paymentMethodId
      ? (paymentMethods?.find((method) => method.id === paymentMethodId)?.label ?? null)
      : t('paymentForm.cash');

  if (payments.length === 0) {
    return (
      <Card>
        <AppText variant="caption" tone="muted">
          {t('contracts.noPayments')}
        </AppText>
      </Card>
    );
  }

  return (
    <Card>
      {payments.map((payment, index) => {
        const details = [methodLabel(payment.paymentMethodId), payment.note].filter(Boolean).join(' · ');
        return (
          <View
            key={payment.id}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: spacing.md,
              paddingVertical: spacing.md,
              borderBottomWidth: index === payments.length - 1 ? 0 : 1,
              borderBottomColor: colors.border,
            }}
          >
            <View style={{ flex: 1, gap: 2 }}>
              <AppText variant="caption">{formatDate(payment.paidAt, locale)}</AppText>
              {details ? (
                <AppText variant="label" tone="faint" numberOfLines={1}>
                  {details}
                </AppText>
              ) : null}
            </View>
            <MoneyText minorUnits={payment.amount} variant="bodyStrong" tone="success" />
          </View>
        );
      })}
    </Card>
  );
}
