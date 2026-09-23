import { View } from 'react-native';
import { CustomerListItem } from '@/api/customers';
import { AppText } from '@/components/ui/app-text';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { PressableScale } from '@/components/ui/pressable-scale';
import { useI18n } from '@/i18n/i18n-context';
import { spacing } from '@/theme/tokens';

interface CustomerCardProps {
  customer: CustomerListItem;
  onPress: () => void;
  onLongPress?: () => void;
}

export function CustomerCard({ customer, onPress, onLongPress }: CustomerCardProps) {
  const { t } = useI18n();
  return (
    <PressableScale
      onPress={onPress}
      onLongPress={onLongPress}
      accessibilityRole="button"
      accessibilityLabel={customer.name}
    >
      <Card>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
          <Avatar name={customer.name} photoUrl={customer.photoUrl} />
          <View style={{ flex: 1, gap: 2 }}>
            <AppText variant="bodyStrong" numberOfLines={1}>
              {customer.name}
            </AppText>
            <AppText variant="caption" tone="muted">
              {customer.phone}
            </AppText>
            {customer.address ? (
              <AppText variant="label" tone="faint" numberOfLines={1}>
                {customer.address}
              </AppText>
            ) : null}
          </View>
          {customer.status === 'DELETED' ? <Badge label={t('customerActions.deleted')} tone="neutral" /> : null}
          {customer.hasOverdue ? <Badge label={t('customers.overdue')} tone="danger" /> : null}
        </View>
      </Card>
    </PressableScale>
  );
}
