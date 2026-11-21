import { View } from 'react-native';
import { JAMEYA_RECURRENCE_TYPES, JameyaRecurrenceType } from '@/api/jameyas';
import { AppText } from '@/components/ui/app-text';
import { ChoiceChips } from '@/components/ui/choice-chips';
import { DateStepper } from '@/components/ui/date-stepper';
import { TextField } from '@/components/ui/text-field';
import { useI18n } from '@/i18n/i18n-context';
import { spacing } from '@/theme/tokens';
import { JAMEYA_NAME_MAX_LENGTH, JAMEYA_NOTE_MAX_LENGTH } from '../jameya-limits';
import { JameyaFormField, JameyaFormValues } from './use-jameya-form';

interface JameyaDetailsStepProps {
  values: JameyaFormValues;
  setField: <K extends keyof JameyaFormValues>(field: K, value: JameyaFormValues[K]) => void;
  errorFor: (field: JameyaFormField) => string | undefined;
}

export function JameyaDetailsStep({ values, setField, errorFor }: JameyaDetailsStepProps) {
  const { t } = useI18n();
  return (
    <View style={{ gap: spacing.lg }}>
      <AppText variant="caption" tone="muted">
        {t('jameyas.new.description')}
      </AppText>
      <TextField
        label={t('jameyas.new.name')}
        placeholder={t('jameyas.new.namePlaceholder')}
        value={values.name}
        onChangeText={(text) => setField('name', text)}
        maxLength={JAMEYA_NAME_MAX_LENGTH}
        error={errorFor('name')}
      />
      <TextField
        label={t('jameyas.new.shareAmount')}
        value={values.shareAmount}
        onChangeText={(text) => setField('shareAmount', text)}
        keyboardType="decimal-pad"
        placeholder="0"
        error={errorFor('shareAmount')}
      />
      <View style={{ gap: spacing.xs }}>
        <AppText variant="caption" tone="muted">
          {t('jameyas.new.recurrence')}
        </AppText>
        <ChoiceChips<JameyaRecurrenceType>
          options={JAMEYA_RECURRENCE_TYPES.map((type) => ({ value: type, label: t(`recurrenceType.${type}`) }))}
          selected={values.recurrenceType}
          onSelect={(type) => setField('recurrenceType', type)}
        />
      </View>
      <DateStepper
        label={t('jameyas.new.firstDueDate')}
        value={values.firstDueDate}
        onChange={(date) => setField('firstDueDate', date)}
        showMonthSteps
      />
      <TextField
        label={t('jameyas.new.graceDays')}
        value={values.graceDays}
        onChangeText={(text) => setField('graceDays', text)}
        keyboardType="number-pad"
        hint={t('jameyas.new.graceDaysHint')}
        error={errorFor('graceDays')}
      />
      <TextField
        label={t('jameyas.new.notes')}
        value={values.notes}
        onChangeText={(text) => setField('notes', text)}
        multiline
        optional
        maxLength={JAMEYA_NOTE_MAX_LENGTH}
      />
    </View>
  );
}
