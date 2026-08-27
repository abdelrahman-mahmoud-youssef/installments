import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { ApiError } from '@/api/client';
import { CreatePaymentInput } from '@/api/payments';
import { AppText } from '@/components/ui/app-text';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { Button } from '@/components/ui/button';
import { PressableScale } from '@/components/ui/pressable-scale';
import { TextField } from '@/components/ui/text-field';
import { useI18n } from '@/i18n/i18n-context';
import { todayIsoDate, toMinorUnits } from '@/lib/format';
import { usePaymentMethods } from '@/hooks/queries';
import { useTheme } from '@/theme/theme-context';
import { radius, spacing } from '@/theme/tokens';

interface RecordPaymentSheetProps {
  visible: boolean;
  contractId: string;
  saving: boolean;
  onClose: () => void;
  onSubmit: (input: CreatePaymentInput) => Promise<void>;
}

export function RecordPaymentSheet({
  visible,
  contractId,
  saving,
  onClose,
  onSubmit,
}: RecordPaymentSheetProps) {
  const { t } = useI18n();
  const { colors } = useTheme();
  const { data: paymentMethods } = usePaymentMethods();
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [paymentMethodId, setPaymentMethodId] = useState<string | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      setAmount('');
      setNote('');
      setPaymentMethodId(undefined);
      setError(null);
    }
  }, [visible]);

  const activeMethods = (paymentMethods ?? []).filter((method) => method.isActive);

  const submit = async () => {
    const parsedAmount = Number(amount);
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setError(t('contracts.amountRequired'));
      return;
    }
    setError(null);
    try {
      await onSubmit({
        contractId,
        amount: toMinorUnits(parsedAmount),
        paymentMethodId,
        paidAt: todayIsoDate(),
        note: note.trim() || undefined,
      });
    } catch (submitError) {
      setError(submitError instanceof ApiError ? submitError.message : t('common.genericError'));
    }
  };

  return (
    <BottomSheet
      visible={visible}
      onClose={saving ? () => undefined : onClose}
      title={t('contracts.recordPayment')}
    >
      <View style={{ gap: spacing.lg }}>
        <TextField
          label={t('contracts.amount')}
          value={amount}
          onChangeText={setAmount}
          keyboardType="decimal-pad"
          placeholder="0"
          error={error ?? undefined}
          autoFocus
        />
        {activeMethods.length > 0 ? (
          <View style={{ gap: spacing.xs }}>
            <AppText variant="caption" tone="muted">
              {t('contracts.paymentMethod')}
            </AppText>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
              {activeMethods.map((method) => {
                const isSelected = paymentMethodId === method.id;
                return (
                  <PressableScale
                    key={method.id}
                    onPress={() => setPaymentMethodId(isSelected ? undefined : method.id)}
                    accessibilityRole="button"
                    accessibilityState={{ selected: isSelected }}
                    style={{
                      borderWidth: 1.5,
                      borderColor: isSelected ? colors.primary : colors.border,
                      backgroundColor: isSelected ? colors.primaryMuted : colors.surface,
                      borderRadius: radius.full,
                      paddingHorizontal: spacing.md,
                      paddingVertical: spacing.sm,
                    }}
                  >
                    <AppText variant="caption" tone={isSelected ? 'primary' : 'default'}>
                      {method.label}
                    </AppText>
                  </PressableScale>
                );
              })}
            </View>
          </View>
        ) : null}
        <TextField label={t('contracts.note')} value={note} onChangeText={setNote} optional multiline />
        <Button title={t('common.save')} onPress={() => void submit()} loading={saving} />
      </View>
    </BottomSheet>
  );
}
