import { View } from 'react-native';
import { CalculationMethod, RecurrenceType } from '@/api/contracts';
import { AppText } from '@/components/ui/app-text';
import { ChoiceChips } from '@/components/ui/choice-chips';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { TextField } from '@/components/ui/text-field';
import { useI18n } from '@/i18n/i18n-context';
import { spacing } from '@/theme/tokens';
import { ContractFormValues } from './use-contract-form';

const CALCULATION_METHODS: CalculationMethod[] = ['FIXED_COUNT', 'FIXED_AMOUNT', 'MARKUP_PERCENT'];
const RECURRENCE_TYPES: RecurrenceType[] = ['MONTHLY', 'EVERY_X_DAYS', 'WEEKLY', 'BIWEEKLY'];

interface PlanFieldsProps {
  values: ContractFormValues;
  errors: Partial<Record<'markupPercent' | 'installmentCount' | 'fixedInstallmentAmount' | 'intervalDays', string>>;
  onChange: <K extends keyof ContractFormValues>(field: K, value: ContractFormValues[K]) => void;
}

export function PlanFields({ values, errors, onChange }: PlanFieldsProps) {
  const { t } = useI18n();
  const method = values.calculationMethod;

  return (
    <View style={{ gap: spacing.lg }}>
      <View style={{ gap: spacing.xs }}>
        <AppText variant="caption" tone="muted">
          {t('contractForm.calculationMethod')}
        </AppText>
        <SegmentedControl
          options={CALCULATION_METHODS.map((value) => ({ value, label: t(`calculationMethod.${value}`) }))}
          selected={method}
          onSelect={(value) => onChange('calculationMethod', value)}
        />
        <AppText variant="label" tone="faint">
          {t(`calculationMethodHint.${method}`)}
        </AppText>
      </View>

      {method === 'MARKUP_PERCENT' ? (
        <TextField
          label={t('contractForm.markupPercent')}
          value={values.markupPercent}
          onChangeText={(text) => onChange('markupPercent', text)}
          keyboardType="decimal-pad"
          placeholder="20"
          error={errors.markupPercent}
        />
      ) : null}

      {method === 'FIXED_AMOUNT' ? (
        <TextField
          label={t('contractForm.fixedInstallmentAmount')}
          value={values.fixedInstallmentAmount}
          onChangeText={(text) => onChange('fixedInstallmentAmount', text)}
          keyboardType="decimal-pad"
          placeholder="0"
          error={errors.fixedInstallmentAmount}
        />
      ) : (
        <TextField
          label={t('contractForm.installmentCount')}
          value={values.installmentCount}
          onChangeText={(text) => onChange('installmentCount', text)}
          keyboardType="number-pad"
          error={errors.installmentCount}
        />
      )}

      <View style={{ gap: spacing.xs }}>
        <AppText variant="caption" tone="muted">
          {t('contractForm.recurrence')}
        </AppText>
        <ChoiceChips
          options={RECURRENCE_TYPES.map((value) => ({ value, label: t(`recurrenceType.${value}`) }))}
          selected={values.recurrenceType}
          onSelect={(value) => onChange('recurrenceType', value)}
        />
      </View>

      {values.recurrenceType === 'EVERY_X_DAYS' ? (
        <TextField
          label={t('contractForm.intervalDays')}
          value={values.intervalDays}
          onChangeText={(text) => onChange('intervalDays', text)}
          keyboardType="number-pad"
          placeholder="10"
          error={errors.intervalDays}
        />
      ) : null}
    </View>
  );
}
