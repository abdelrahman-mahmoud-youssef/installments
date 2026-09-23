import { View } from 'react-native';
import { OverdueCustomerSummary } from '@/api/reports';
import { AppText } from '@/components/ui/app-text';
import { Card } from '@/components/ui/card';
import { SectionHeader } from '@/components/ui/section-header';
import { useI18n } from '@/i18n/i18n-context';
import { spacing } from '@/theme/tokens';
import { OverdueCustomerRow } from './overdue-customer-row';

interface OverdueCustomersSectionProps {
  customers: OverdueCustomerSummary[];
  onOpenCustomer: (customerId: string) => void;
}

export function OverdueCustomersSection({ customers, onOpenCustomer }: OverdueCustomersSectionProps) {
  const { t } = useI18n();
  return (
    <View style={{ gap: spacing.md }}>
      <SectionHeader title={t('reports.overdueCustomers')} />
      <Card>
        {customers.length === 0 ? (
          <AppText variant="caption" tone="muted">
            {t('reports.emptyOverdue')}
          </AppText>
        ) : (
          customers.map((customer, index) => (
            <OverdueCustomerRow
              key={customer.customerId}
              customer={customer}
              onPress={() => onOpenCustomer(customer.customerId)}
              isLast={index === customers.length - 1}
            />
          ))
        )}
      </Card>
    </View>
  );
}
