import { View } from 'react-native';
import { RecurrenceType } from '@/api/contracts';
import { AppText } from '@/components/ui/app-text';
import { Card } from '@/components/ui/card';
import { MoneyText } from '@/components/ui/money-text';
import { useI18n } from '@/i18n/i18n-context';
import { formatDate, formatNumber } from '@/lib/format';
import { generateDueDates, SchedulePreview } from '@/lib/installment-schedule';
import { useTheme } from '@/theme/theme-context';
import { radius, spacing } from '@/theme/tokens';

const VISIBLE_DUE_DATES = 3;

interface SchedulePreviewCardProps {
  preview: SchedulePreview;
  downPayment: number;
  firstPaymentDate: string;
  recurrenceType: RecurrenceType;
  intervalDays?: number;
}

function SummaryRow({ label, minorUnits, emphasized = false }: { label: string; minorUnits: number; emphasized?: boolean }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
      <AppText variant={emphasized ? 'bodyStrong' : 'caption'} tone={emphasized ? 'default' : 'muted'}>
        {label}
      </AppText>
      <MoneyText minorUnits={minorUnits} variant={emphasized ? 'heading' : 'bodyStrong'} tone={emphasized ? 'primary' : 'default'} />
    </View>
  );
}

export function SchedulePreviewCard({
  preview,
  downPayment,
  firstPaymentDate,
  recurrenceType,
  intervalDays,
}: SchedulePreviewCardProps) {
  const { t, locale } = useI18n();
  const { colors } = useTheme();
  const amounts = preview.installmentAmounts;
  const regularAmount = amounts[0];
  const finalAmount = amounts[amounts.length - 1];
  const dueDates = generateDueDates({ firstPaymentDate, recurrenceType, count: amounts.length, intervalDays });
  const lastDueDate = dueDates[dueDates.length - 1];

  return (
    <Card>
      <View style={{ gap: spacing.md }}>
        <AppText variant="heading">{t('contractForm.summary')}</AppText>
        <SummaryRow label={t('contractForm.contractTotal')} minorUnits={preview.totalAmount} />
        {downPayment > 0 ? <SummaryRow label={t('contracts.downPayment')} minorUnits={downPayment} /> : null}
        <SummaryRow label={t('contractForm.financed')} minorUnits={preview.financedAmount} emphasized />
        <View
          style={{
            backgroundColor: colors.primaryMuted,
            borderRadius: radius.md,
            padding: spacing.md,
            gap: spacing.xs,
          }}
        >
          <AppText variant="bodyStrong" tone="primary">
            {t('contractForm.installmentsOf', {
              count: formatNumber(amounts.length, locale),
            })}
          </AppText>
          <MoneyText minorUnits={regularAmount} variant="title" tone="primary" />
          {finalAmount !== regularAmount ? (
            <AppText variant="caption" tone="muted">
              {t('contractForm.finalInstallment')} · <MoneyText minorUnits={finalAmount} variant="caption" tone="muted" />
            </AppText>
          ) : null}
        </View>
        {dueDates.length > 0 ? (
          <View style={{ gap: spacing.xs }}>
            <AppText variant="caption" tone="muted">
              {t('contractForm.firstDueDates')}
            </AppText>
            {dueDates.slice(0, VISIBLE_DUE_DATES).map((dueDate, index) => (
              <View key={dueDate} style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <AppText variant="caption">
                  {t('contracts.installmentNumber', { sequence: formatNumber(index + 1, locale) })}
                </AppText>
                <AppText variant="caption" tone="muted">
                  {formatDate(dueDate, locale)}
                </AppText>
              </View>
            ))}
            {dueDates.length > VISIBLE_DUE_DATES ? (
              <AppText variant="caption" tone="muted">
                {t('contractForm.lastDueDate', { date: formatDate(lastDueDate, locale) })}
              </AppText>
            ) : null}
          </View>
        ) : null}
      </View>
    </Card>
  );
}
