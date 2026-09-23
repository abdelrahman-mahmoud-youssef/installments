import { View } from 'react-native';
import { PaymentMethodMonthlySummary } from '@/api/payment-method-transactions';
import { AppText } from '@/components/ui/app-text';
import { Card } from '@/components/ui/card';
import { MoneyText } from '@/components/ui/money-text';
import { ProgressBar } from '@/components/ui/progress-bar';
import { StatCard } from '@/components/ui/stat-card';
import { useI18n } from '@/i18n/i18n-context';
import { formatMoney, formatPercent } from '@/lib/format';
import { spacing } from '@/theme/tokens';

const LIMIT_WARNING_RATIO = 0.8;

interface WalletMonthSummaryProps {
  summary: PaymentMethodMonthlySummary;
}

export function WalletMonthSummary({ summary }: WalletMonthSummaryProps) {
  const { t, locale } = useI18n();
  const received = summary.paymentTotal + summary.receivedTotal;

  return (
    <View style={{ gap: spacing.md }}>
      <View style={{ flexDirection: 'row', gap: spacing.md }}>
        <StatCard icon="arrow-down" label={t('wallets.received')} value={formatMoney(received, locale)} tone="success" />
        <StatCard icon="arrow-up" label={t('wallets.sent')} value={formatMoney(summary.sentTotal, locale)} tone="danger" />
      </View>
      <Card>
        {summary.monthlyLimit ? (
          <LimitUsage total={summary.total} limit={summary.monthlyLimit} />
        ) : (
          <AppText variant="caption" tone="muted">
            {t('wallets.noLimit')}
          </AppText>
        )}
      </Card>
    </View>
  );
}

function LimitUsage({ total, limit }: { total: number; limit: number }) {
  const { t, locale } = useI18n();
  const ratio = total / limit;
  const isNearLimit = ratio >= LIMIT_WARNING_RATIO;
  const percent = formatPercent(Math.min(ratio, 1), locale);

  return (
    <View style={{ gap: spacing.md }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <View style={{ gap: 2 }}>
          <AppText variant="label" tone="muted">
            {t('wallets.remaining')}
          </AppText>
          <MoneyText
            minorUnits={Math.max(limit - total, 0)}
            variant="title"
            tone={isNearLimit ? 'danger' : 'primary'}
          />
        </View>
        <View style={{ alignItems: 'flex-end', gap: 2 }}>
          <AppText variant="label" tone="muted">
            {t('wallets.limit')}
          </AppText>
          <MoneyText minorUnits={limit} variant="bodyStrong" />
        </View>
      </View>
      <ProgressBar ratio={Math.min(ratio, 1)} tone={isNearLimit ? 'danger' : 'primary'} />
      <AppText variant="label" tone="muted">
        {t('wallets.limitUsed', { percent })}
      </AppText>
    </View>
  );
}
