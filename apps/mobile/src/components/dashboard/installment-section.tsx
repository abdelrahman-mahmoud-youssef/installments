import { View } from 'react-native';
import { DashboardInstallmentSummary } from '@/api/dashboard';
import { AppText } from '@/components/ui/app-text';
import { Card } from '@/components/ui/card';
import { SectionHeader } from '@/components/ui/section-header';
import { spacing } from '@/theme/tokens';
import { InstallmentRow } from './installment-row';

interface InstallmentSectionProps {
  title: string;
  installments: DashboardInstallmentSummary[];
  emptyMessage: string;
  showDueDate: boolean;
  onOpenContract: (contractId: string) => void;
}

export function InstallmentSection({
  title,
  installments,
  emptyMessage,
  showDueDate,
  onOpenContract,
}: InstallmentSectionProps) {
  return (
    <View style={{ gap: spacing.md }}>
      <SectionHeader title={title} />
      <Card>
        {installments.length === 0 ? (
          <AppText variant="caption" tone="muted">
            {emptyMessage}
          </AppText>
        ) : (
          installments.map((installment, index) => (
            <InstallmentRow
              key={installment.id}
              installment={installment}
              onPress={() => onOpenContract(installment.contractId)}
              showDueDate={showDueDate}
              isLast={index === installments.length - 1}
            />
          ))
        )}
      </Card>
    </View>
  );
}
