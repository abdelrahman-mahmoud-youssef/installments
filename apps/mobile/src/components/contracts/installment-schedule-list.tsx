import { View } from 'react-native';
import { Installment } from '@/api/contracts';
import { AppText } from '@/components/ui/app-text';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { MoneyText } from '@/components/ui/money-text';
import { useI18n } from '@/i18n/i18n-context';
import { formatDate, formatMoney, formatNumber } from '@/lib/format';
import { remainingOf } from '@/lib/installment-balance';
import { deriveInstallmentStatus, installmentStatusTone } from '@/lib/statuses';
import { useTheme } from '@/theme/theme-context';
import { spacing } from '@/theme/tokens';

interface InstallmentScheduleListProps {
  installments: Installment[];
}

export function InstallmentScheduleList({ installments }: InstallmentScheduleListProps) {
  const { t, locale } = useI18n();
  const { colors } = useTheme();

  return (
    <Card>
      {installments.map((installment, index) => {
        const derivedStatus = deriveInstallmentStatus(installment);
        const remaining = remainingOf(installment);
        const showBreakdown = installment.paidAmount > 0 && remaining > 0;
        return (
          <View
            key={installment.id}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: spacing.md,
              paddingVertical: spacing.md,
              borderBottomWidth: index === installments.length - 1 ? 0 : 1,
              borderBottomColor: colors.border,
            }}
          >
            <View style={{ flex: 1, gap: 2 }}>
              <AppText variant="bodyStrong">
                {t('contracts.installmentNumber', { sequence: formatNumber(installment.sequence, locale) })}
              </AppText>
              <AppText variant="label" tone="faint">
                {t('contracts.dueOn', { date: formatDate(installment.dueDate, locale) })}
              </AppText>
              {showBreakdown ? (
                <AppText variant="label" tone="muted">
                  {t('contractDetail.paidAndRemaining', {
                    paid: formatMoney(installment.paidAmount, locale),
                    remaining: formatMoney(remaining, locale),
                  })}
                </AppText>
              ) : null}
            </View>
            <View style={{ alignItems: 'flex-end', gap: spacing.xs }}>
              <MoneyText minorUnits={installment.amount} variant="bodyStrong" />
              <Badge label={t(`status.installment.${derivedStatus}`)} tone={installmentStatusTone[derivedStatus]} />
            </View>
          </View>
        );
      })}
    </Card>
  );
}
