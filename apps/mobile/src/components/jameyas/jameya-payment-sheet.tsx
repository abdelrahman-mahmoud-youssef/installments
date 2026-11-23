import { View } from 'react-native';
import { ApiError } from '@/api/client';
import { JameyaDetail } from '@/api/jameyas';
import { AppText } from '@/components/ui/app-text';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { Button } from '@/components/ui/button';
import { ChoiceChips } from '@/components/ui/choice-chips';
import { DateStepper } from '@/components/ui/date-stepper';
import { TextField } from '@/components/ui/text-field';
import { useToast } from '@/components/ui/toast-context';
import { useRecordJameyaPayment } from '@/hooks/queries';
import { useI18n } from '@/i18n/i18n-context';
import { todayIsoDate } from '@/lib/format';
import { suggestedPaymentOf } from '@/lib/jameya';
import { spacing } from '@/theme/tokens';
import { JAMEYA_NOTE_MAX_LENGTH } from './jameya-limits';
import { useJameyaMoneyEntry } from './use-jameya-money-entry';

interface JameyaPaymentSheetProps {
  visible: boolean;
  jameya: JameyaDetail;
  onClose: () => void;
}

export function JameyaPaymentSheet({ visible, jameya, onClose }: JameyaPaymentSheetProps) {
  const { t } = useI18n();
  const { showToast } = useToast();
  const recordPayment = useRecordJameyaPayment(jameya.id);
  const owingMembers = jameya.members.filter((member) => member.remainingAmount > 0);
  const firstCustomerId = owingMembers[0]?.customerId ?? '';
  const entry = useJameyaMoneyEntry(visible, {
    customerId: firstCustomerId,
    amount: firstCustomerId ? suggestedPaymentOf(jameya, firstCustomerId) : 0,
  });
  const selectedMember = jameya.members.find((member) => member.customerId === entry.customerId);
  const owed = selectedMember?.remainingAmount ?? 0;

  const submit = async () => {
    const input = entry.validInput(owed);
    if (!input) {
      return;
    }
    try {
      await recordPayment.mutateAsync(input);
      showToast(t('jameyas.paymentDialog.recorded'));
      onClose();
    } catch (error) {
      entry.setError(error instanceof ApiError ? error.message : t('jameyas.paymentDialog.recordError'));
    }
  };

  return (
    <BottomSheet
      visible={visible}
      onClose={recordPayment.isPending ? () => undefined : onClose}
      title={t('jameyas.paymentDialog.title')}
    >
      <View style={{ gap: spacing.lg }}>
        <View style={{ gap: spacing.xs }}>
          <AppText variant="caption" tone="muted">
            {t('jameyas.paymentDialog.member')}
          </AppText>
          <ChoiceChips
            options={owingMembers.map((member) => ({ value: member.customerId, label: member.name }))}
            selected={entry.customerId || null}
            onSelect={(customerId) => {
              entry.setCustomerId(customerId);
              entry.setAmount(suggestedPaymentOf(jameya, customerId));
            }}
          />
        </View>

        {selectedMember ? (
          <AppText variant="caption" tone="muted">
            {t('jameyas.paymentDialog.description', { name: selectedMember.name })}
          </AppText>
        ) : null}

        <TextField
          label={t('jameyas.paymentDialog.amount')}
          value={entry.amountText}
          onChangeText={entry.setAmountText}
          keyboardType="number-pad"
          placeholder="0"
          error={entry.error ?? undefined}
        />
        <DateStepper
          label={t('jameyas.paymentDialog.paidAt')}
          value={entry.paidAt}
          onChange={entry.setPaidAt}
          maxDate={todayIsoDate()}
        />

        <TextField
          label={t('jameyas.paymentDialog.note')}
          value={entry.note}
          onChangeText={entry.setNote}
          multiline
          maxLength={JAMEYA_NOTE_MAX_LENGTH}
        />

        <Button
          title={t('jameyas.paymentDialog.submit')}
          onPress={() => void submit()}
          loading={recordPayment.isPending}
          disabled={owingMembers.length === 0}
        />
      </View>
    </BottomSheet>
  );
}
