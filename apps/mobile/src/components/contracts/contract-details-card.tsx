import { ReactNode } from 'react';
import { View } from 'react-native';
import { ContractDetail } from '@/api/contracts';
import { AppText } from '@/components/ui/app-text';
import { Card } from '@/components/ui/card';
import { MoneyText } from '@/components/ui/money-text';
import { useI18n } from '@/i18n/i18n-context';
import { formatDate, formatNumber } from '@/lib/format';
import { useTheme } from '@/theme/theme-context';
import { spacing } from '@/theme/tokens';

interface ContractDetailsCardProps {
  contract: ContractDetail;
}

function DetailRow({ label, children, isLast = false }: { label: string; children: ReactNode; isLast?: boolean }) {
  const { colors } = useTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: spacing.md,
        paddingVertical: spacing.sm,
        borderBottomWidth: isLast ? 0 : 1,
        borderBottomColor: colors.border,
      }}
    >
      <AppText variant="caption" tone="muted">
        {label}
      </AppText>
      {children}
    </View>
  );
}

export function ContractDetailsCard({ contract }: ContractDetailsCardProps) {
  const { t, locale } = useI18n();
  const profit = contract.costPrice !== null ? contract.productPrice - contract.costPrice : null;
  const recurrenceLabel =
    contract.recurrenceType === 'EVERY_X_DAYS' && contract.intervalDays
      ? t('contractDetail.everyDays', { days: formatNumber(contract.intervalDays, locale) })
      : t(`recurrenceType.${contract.recurrenceType}`);
  const methodLabel =
    contract.calculationMethod === 'MARKUP_PERCENT' && contract.markupPercent !== null
      ? `${t('calculationMethod.MARKUP_PERCENT')} · ${formatNumber(contract.markupPercent, locale)}%`
      : t(`calculationMethod.${contract.calculationMethod}`);

  return (
    <Card>
      <DetailRow label={t('contracts.productPrice')}>
        <MoneyText minorUnits={contract.productPrice} variant="bodyStrong" />
      </DetailRow>
      {contract.costPrice !== null ? (
        <DetailRow label={t('contractForm.costPrice')}>
          <MoneyText minorUnits={contract.costPrice} variant="bodyStrong" />
        </DetailRow>
      ) : null}
      {profit !== null ? (
        <DetailRow label={t('contractDetail.profit')}>
          <MoneyText minorUnits={profit} variant="bodyStrong" tone={profit >= 0 ? 'success' : 'danger'} />
        </DetailRow>
      ) : null}
      {contract.downPayment > 0 ? (
        <DetailRow label={t('contracts.downPayment')}>
          <MoneyText minorUnits={contract.downPayment} variant="bodyStrong" />
        </DetailRow>
      ) : null}
      <DetailRow label={t('contractForm.calculationMethod')}>
        <AppText variant="bodyStrong">{methodLabel}</AppText>
      </DetailRow>
      <DetailRow label={t('contractForm.recurrence')}>
        <AppText variant="bodyStrong">{recurrenceLabel}</AppText>
      </DetailRow>
      <DetailRow label={t('contractForm.installmentCount')}>
        <AppText variant="bodyStrong">{formatNumber(contract.installmentCount, locale)}</AppText>
      </DetailRow>
      <DetailRow label={t('contractForm.startDate')}>
        <AppText variant="bodyStrong">{formatDate(contract.startDate, locale)}</AppText>
      </DetailRow>
      <DetailRow label={t('contractForm.firstPaymentDate')} isLast>
        <AppText variant="bodyStrong">{formatDate(contract.firstPaymentDate, locale)}</AppText>
      </DetailRow>
    </Card>
  );
}
