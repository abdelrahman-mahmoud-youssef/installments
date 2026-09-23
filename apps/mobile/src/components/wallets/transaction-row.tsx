import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MoneyDirection } from '@/api/payment-method-transactions';
import { AppText } from '@/components/ui/app-text';
import { Badge } from '@/components/ui/badge';
import { MoneyText } from '@/components/ui/money-text';
import { ImageThumbnail } from '@/components/ui/image-thumbnail';
import { useI18n } from '@/i18n/i18n-context';
import { useTheme } from '@/theme/theme-context';
import { radius, spacing } from '@/theme/tokens';

const ICON_SIZE = 40;

interface TransactionRowProps {
  direction: MoneyDirection;
  amount: number;
  title: string;
  subtitle?: string;
  tag?: string;
  receiptUrl?: string | null;
}

export function TransactionRow({ direction, amount, title, subtitle, tag, receiptUrl }: TransactionRowProps) {
  const { colors } = useTheme();
  const { t } = useI18n();
  const isOutgoing = direction === 'OUT';
  const tint = isOutgoing ? colors.danger : colors.success;

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.sm }}>
      <View
        style={{
          width: ICON_SIZE,
          height: ICON_SIZE,
          borderRadius: radius.full,
          backgroundColor: isOutgoing ? colors.dangerMuted : colors.successMuted,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Ionicons name={isOutgoing ? 'arrow-up' : 'arrow-down'} size={18} color={tint} />
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
          <AppText variant="bodyStrong" numberOfLines={1} style={{ flexShrink: 1 }}>
            {title}
          </AppText>
          {tag ? <Badge label={tag} tone="neutral" /> : null}
        </View>
        {subtitle ? (
          <AppText variant="caption" tone="muted" numberOfLines={1}>
            {subtitle}
          </AppText>
        ) : null}
      </View>
      {receiptUrl ? <ImageThumbnail path={receiptUrl} label={t('transactions.viewReceipt')} /> : null}
      <MoneyText minorUnits={amount} variant="bodyStrong" tone={isOutgoing ? 'danger' : 'success'} />
    </View>
  );
}
