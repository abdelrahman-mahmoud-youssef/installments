import { View } from 'react-native';
import { DashboardPaymentSummary } from '@/api/dashboard';
import { AppText } from '@/components/ui/app-text';
import { Card } from '@/components/ui/card';
import { SectionHeader } from '@/components/ui/section-header';
import { useI18n } from '@/i18n/i18n-context';
import { spacing } from '@/theme/tokens';
import { RecentPaymentRow } from './recent-payment-row';

interface RecentPaymentsSectionProps {
  payments: DashboardPaymentSummary[];
  onOpenContract: (contractId: string) => void;
}

export function RecentPaymentsSection({ payments, onOpenContract }: RecentPaymentsSectionProps) {
  const { t } = useI18n();
  return (
    <View style={{ gap: spacing.md }}>
      <SectionHeader title={t('dashboard.recentPayments')} />
      <Card>
        {payments.length === 0 ? (
          <AppText variant="caption" tone="muted">
            {t('dashboard.emptyPayments')}
          </AppText>
        ) : (
          payments.map((payment, index) => (
            <RecentPaymentRow
              key={payment.id}
              payment={payment}
              onPress={() => onOpenContract(payment.contractId)}
              isLast={index === payments.length - 1}
            />
          ))
        )}
      </Card>
    </View>
  );
}
