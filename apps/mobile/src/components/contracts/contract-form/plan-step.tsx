import { View } from 'react-native';
import { AppText } from '@/components/ui/app-text';
import { Card } from '@/components/ui/card';
import { DateStepper } from '@/components/ui/date-stepper';
import { SectionHeader } from '@/components/ui/section-header';
import { useI18n } from '@/i18n/i18n-context';
import { parseCountInput, parseNonNegativeAmountInput, toMinorUnits } from '@/lib/format';
import { SchedulePreview } from '@/lib/installment-schedule';
import { spacing } from '@/theme/tokens';
import { PlanFields } from './plan-fields';
import { SchedulePreviewCard } from './schedule-preview-card';
import { ContractFormField, ContractFormValues, SetContractFormField } from './use-contract-form';

interface PlanStepProps {
  values: ContractFormValues;
  setField: SetContractFormField;
  errorFor: (field: ContractFormField) => string | undefined;
  preview: SchedulePreview | null;
  apiError: string | null;
}

export function PlanStep({ values, setField, errorFor, preview, apiError }: PlanStepProps) {
  const { t } = useI18n();
  const downPaymentMinor = toMinorUnits(parseNonNegativeAmountInput(values.downPayment) ?? 0);
  const errorMessage = apiError ?? errorFor('schedule');

  return (
    <>
      <View style={{ gap: spacing.md }}>
        <SectionHeader title={t('contractForm.planSection')} />
        <Card>
          <PlanFields
            values={values}
            onChange={setField}
            errors={{
              markupPercent: errorFor('markupPercent'),
              installmentCount: errorFor('installmentCount'),
              fixedInstallmentAmount: errorFor('fixedInstallmentAmount'),
              intervalDays: errorFor('intervalDays'),
            }}
          />
        </Card>
      </View>

      <View style={{ gap: spacing.md }}>
        <SectionHeader title={t('contractForm.datesSection')} />
        <Card>
          <View style={{ gap: spacing.lg }}>
            <DateStepper
              label={t('contractForm.startDate')}
              value={values.startDate}
              onChange={(date) => setField('startDate', date)}
              showMonthSteps
            />
            <DateStepper
              label={t('contractForm.firstPaymentDate')}
              value={values.firstPaymentDate}
              onChange={(date) => setField('firstPaymentDate', date)}
              showMonthSteps
            />
          </View>
        </Card>
      </View>

      {preview ? (
        <SchedulePreviewCard
          preview={preview}
          downPayment={downPaymentMinor}
          firstPaymentDate={values.firstPaymentDate}
          recurrenceType={values.recurrenceType}
          intervalDays={parseCountInput(values.intervalDays) ?? undefined}
        />
      ) : null}

      {errorMessage ? (
        <AppText variant="caption" tone="danger">
          {errorMessage}
        </AppText>
      ) : null}
    </>
  );
}
