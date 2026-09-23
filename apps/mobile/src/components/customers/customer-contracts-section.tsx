import { useRouter } from 'expo-router';
import { View } from 'react-native';
import { CustomerContractSummary } from '@/api/customers';
import { AppText } from '@/components/ui/app-text';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { MoneyText } from '@/components/ui/money-text';
import { PressableScale } from '@/components/ui/pressable-scale';
import { SectionHeader } from '@/components/ui/section-header';
import { useI18n } from '@/i18n/i18n-context';
import { formatDate } from '@/lib/format';
import { contractStatusTone } from '@/lib/statuses';
import { spacing } from '@/theme/tokens';

interface CustomerContractsSectionProps {
  contracts: CustomerContractSummary[];
  onNewContract: () => void;
}

export function CustomerContractsSection({ contracts, onNewContract }: CustomerContractsSectionProps) {
  const { t, locale } = useI18n();
  const router = useRouter();
  const sortedContracts = [...contracts].sort((first, second) => second.createdAt.localeCompare(first.createdAt));

  return (
    <View style={{ gap: spacing.md }}>
      <SectionHeader
        title={t('customers.contractsSection')}
        actionTitle={t('contractForm.title')}
        onAction={onNewContract}
      />
      {sortedContracts.length === 0 ? (
        <Card>
          <AppText variant="caption" tone="muted">
            {t('customers.noContracts')}
          </AppText>
        </Card>
      ) : (
        sortedContracts.map((contract) => (
          <PressableScale
            key={contract.id}
            onPress={() => router.push(`/contract/${contract.id}`)}
            accessibilityRole="button"
          >
            <Card>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
                <View style={{ flex: 1, gap: spacing.xs }}>
                  <AppText variant="bodyStrong" numberOfLines={1}>
                    {contract.productName}
                  </AppText>
                  <AppText variant="caption" tone="muted">
                    <MoneyText minorUnits={contract.totalAmount} variant="caption" tone="muted" />
                    {' · '}
                    {formatDate(contract.createdAt, locale)}
                  </AppText>
                </View>
                <Badge label={t(`status.contract.${contract.status}`)} tone={contractStatusTone[contract.status]} />
              </View>
            </Card>
          </PressableScale>
        ))
      )}
    </View>
  );
}
