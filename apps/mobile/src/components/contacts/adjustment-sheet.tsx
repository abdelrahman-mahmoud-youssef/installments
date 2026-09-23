import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { ApiError } from '@/api/client';
import { MoneyDirection } from '@/api/payment-method-transactions';
import { AppText } from '@/components/ui/app-text';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { Button } from '@/components/ui/button';
import { DateStepper } from '@/components/ui/date-stepper';
import { MoneyText } from '@/components/ui/money-text';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { TextField } from '@/components/ui/text-field';
import { useToast } from '@/components/ui/toast-context';
import { useCreateCounterpartyAdjustment } from '@/hooks/queries';
import { useI18n } from '@/i18n/i18n-context';
import { applyAdjustment, balanceStatus, balanceTone } from '@/lib/counterparty-balance';
import { parseAmountInput, todayIsoDate, toMinorUnits } from '@/lib/format';
import { useTheme } from '@/theme/theme-context';
import { radius, spacing } from '@/theme/tokens';

interface AdjustmentSheetProps {
  visible: boolean;
  counterpartyId: string;
  currentBalance: number;
  onClose: () => void;
}

export function AdjustmentSheet({ visible, counterpartyId, currentBalance, onClose }: AdjustmentSheetProps) {
  const { t } = useI18n();
  const { colors } = useTheme();
  const { showToast } = useToast();
  const createMutation = useCreateCounterpartyAdjustment();
  const [direction, setDirection] = useState<MoneyDirection>('OUT');
  const [amount, setAmount] = useState('');
  const [occurredAt, setOccurredAt] = useState(todayIsoDate());
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) {
      return;
    }
    setDirection('OUT');
    setAmount('');
    setOccurredAt(todayIsoDate());
    setNote('');
    setError(null);
  }, [visible]);

  const parsedAmount = parseAmountInput(amount);
  const previewBalance =
    parsedAmount === null ? currentBalance : applyAdjustment(currentBalance, direction, toMinorUnits(parsedAmount));
  const previewStatus = balanceStatus(previewBalance);

  const submit = async () => {
    if (parsedAmount === null) {
      setError(t('transactions.amountRequired'));
      return;
    }
    setError(null);
    try {
      await createMutation.mutateAsync({
        id: counterpartyId,
        input: { direction, amount: toMinorUnits(parsedAmount), occurredAt, note: note.trim() || undefined },
      });
      showToast(t('contacts.adjustmentSaved'));
      onClose();
    } catch (submitError) {
      setError(submitError instanceof ApiError ? submitError.message : t('common.genericError'));
    }
  };

  const isSaving = createMutation.isPending;

  return (
    <BottomSheet visible={visible} onClose={isSaving ? () => undefined : onClose} title={t('contacts.adjustmentTitle')}>
      <View style={{ gap: spacing.lg }}>
        <AppText variant="caption" tone="muted">
          {t('contacts.adjustmentHint')}
        </AppText>
        <SegmentedControl
          options={[
            { value: 'OUT', label: t('contacts.increase'), icon: 'trending-up', activeColor: colors.danger },
            { value: 'IN', label: t('contacts.decrease'), icon: 'trending-down', activeColor: colors.success },
          ]}
          selected={direction}
          onSelect={setDirection}
        />
        <TextField
          label={t('transactions.amount')}
          value={amount}
          onChangeText={setAmount}
          keyboardType="decimal-pad"
          placeholder="0"
          error={error ?? undefined}
        />
        <DateStepper
          label={t('transactions.date')}
          value={occurredAt}
          onChange={setOccurredAt}
          maxDate={todayIsoDate()}
        />
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: colors.surfaceMuted,
            borderRadius: radius.md,
            padding: spacing.md,
          }}
        >
          <AppText variant="caption" tone="muted">
            {t('contacts.newBalance')}
          </AppText>
          <View style={{ alignItems: 'flex-end' }}>
            <MoneyText minorUnits={Math.abs(previewBalance)} variant="bodyStrong" tone={balanceTone[previewStatus]} />
            <AppText variant="label" tone="muted">
              {t(`contacts.${previewStatus}`)}
            </AppText>
          </View>
        </View>
        <TextField label={t('transactions.note')} value={note} onChangeText={setNote} multiline optional />
        <Button title={t('common.save')} onPress={() => void submit()} loading={isSaving} />
      </View>
    </BottomSheet>
  );
}
