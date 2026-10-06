import { View } from 'react-native';
import { ContractListItem } from '@/api/contracts';
import { AppText } from '@/components/ui/app-text';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { MoneyText } from '@/components/ui/money-text';
import { PressableScale } from '@/components/ui/pressable-scale';
import { useI18n } from '@/i18n/i18n-context';
import { formatNumber } from '@/lib/format';
import { contractStatusTone } from '@/lib/statuses';
import { spacing } from '@/theme/tokens';

interface ContractCardProps {
  contract: ContractListItem;
  onPress: () => void;
}

export function ContractCard({ contract, onPress }: ContractCardProps) {
  const { t, locale } = useI18n();
  return (
    <PressableScale onPress={onPress} accessibilityRole="button" accessibilityLabel={contract.productName}>
      <Card>
        <View style={{ gap: spacing.md }}>
          <View style={{ gap: 2 }}>
            <AppText variant="bodyStrong" numberOfLines={1}>
              {contract.productName}
            </AppText>
            <AppText variant="caption" tone="muted" numberOfLines={1}>
              {contract.customer.name}
            </AppText>
          </View>
          <View style={{ flexDirection: 'row', gap: spacing.xs, overflow: 'hidden' }}>
            {contract.hasOverdue ? <Badge label={t('status.installment.OVERDUE')} tone="danger" /> : null}
            <Badge label={t(`status.contract.${contract.status}`)} tone={contractStatusTone[contract.status]} />
            {contract.tag ? (
              <View style={{ flexShrink: 1 }}>
                <Badge label={contract.tag} tone="info" />
              </View>
            ) : null}
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <MoneyText minorUnits={contract.totalAmount} variant="heading" />
            <AppText variant="caption" tone="muted">
              {t('contracts.installmentsCount', { count: formatNumber(contract.installmentCount, locale) })}
            </AppText>
          </View>
        </View>
      </Card>
    </PressableScale>
  );
}
