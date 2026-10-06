import { TextInput, View } from 'react-native';
import { Installment } from '@/api/contracts';
import { AppText } from '@/components/ui/app-text';
import { MoneyText } from '@/components/ui/money-text';
import { useI18n } from '@/i18n/i18n-context';
import { formatMoney, formatNumber } from '@/lib/format';
import { remainingOf } from '@/lib/installment-balance';
import { useTheme } from '@/theme/theme-context';
import { logicalTextAlign, radius, spacing, touchTarget } from '@/theme/tokens';

const INPUT_WIDTH = 110;

interface ManualAllocationFieldsProps {
  installments: Installment[];
  values: Record<string, string>;
  onChange: (installmentId: string, text: string) => void;
  allocatedTotal: number;
  targetTotal: number;
}

export function ManualAllocationFields({
  installments,
  values,
  onChange,
  allocatedTotal,
  targetTotal,
}: ManualAllocationFieldsProps) {
  const { t, locale } = useI18n();
  const { colors, fontSize } = useTheme();
  const isBalanced = allocatedTotal === targetTotal && targetTotal > 0;

  return (
    <View style={{ gap: spacing.sm }}>
      {installments.map((installment) => (
        <View key={installment.id} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
          <View style={{ flex: 1 }}>
            <AppText variant="caption">
              {t('contracts.installmentNumber', { sequence: formatNumber(installment.sequence, locale) })}
            </AppText>
            <AppText variant="label" tone="muted">
              {t('paymentForm.remainingOnInstallment', { amount: formatMoney(remainingOf(installment), locale) })}
            </AppText>
          </View>
          <TextInput
            value={values[installment.id] ?? ''}
            onChangeText={(text) => onChange(installment.id, text)}
            keyboardType="decimal-pad"
            placeholder="0"
            placeholderTextColor={colors.textFaint}
            accessibilityLabel={t('contracts.installmentNumber', { sequence: String(installment.sequence) })}
            style={{
              width: INPUT_WIDTH,
              minHeight: touchTarget.minHeight,
              borderWidth: 1.5,
              borderColor: colors.border,
              borderRadius: radius.sm,
              paddingHorizontal: spacing.md,
              color: colors.text,
              fontSize: fontSize('md'),
              backgroundColor: colors.surface,
              textAlign: logicalTextAlign.start,
            }}
          />
        </View>
      ))}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <AppText variant="caption" tone="muted">
          {t('paymentForm.allocated')}
        </AppText>
        <AppText variant="caption" tone={isBalanced ? 'success' : 'warning'}>
          <MoneyText minorUnits={allocatedTotal} variant="caption" tone={isBalanced ? 'success' : 'warning'} />
          {' / '}
          <MoneyText minorUnits={targetTotal} variant="caption" tone="muted" />
        </AppText>
      </View>
    </View>
  );
}
