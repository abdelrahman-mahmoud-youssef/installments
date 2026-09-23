import { useEffect, useMemo, useState } from 'react';
import { Switch, View } from 'react-native';
import { ApiError } from '@/api/client';
import { useAuth } from '@/auth/auth-context';
import { Installment } from '@/api/contracts';
import { CreatePaymentInput, ManualAllocation } from '@/api/payments';
import { AppText } from '@/components/ui/app-text';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { Button } from '@/components/ui/button';
import { ChoiceChips, ChoiceOption } from '@/components/ui/choice-chips';
import { DateStepper } from '@/components/ui/date-stepper';
import { MoneyText } from '@/components/ui/money-text';
import { TextField } from '@/components/ui/text-field';
import { usePaymentMethods } from '@/hooks/queries';
import { useI18n } from '@/i18n/i18n-context';
import { formatMoney, parseAmountInput, todayIsoDate, toMajorUnitsText, toMinorUnits } from '@/lib/format';
import { outstandingInstallments, remainingOf } from '@/lib/installment-balance';
import { resolvePaymentMethodPreset } from '@/lib/payment-method-presets';
import { useTheme } from '@/theme/theme-context';
import { radius, spacing } from '@/theme/tokens';
import { ManualAllocationFields } from './manual-allocation-fields';

const CASH_METHOD = 'cash';
const MAX_NOTE_LENGTH = 500;

interface RecordPaymentSheetProps {
  visible: boolean;
  contractId: string;
  installments: Installment[];
  saving: boolean;
  onClose: () => void;
  onSubmit: (input: CreatePaymentInput) => Promise<void>;
}

export function RecordPaymentSheet({
  visible,
  contractId,
  installments,
  saving,
  onClose,
  onSubmit,
}: RecordPaymentSheetProps) {
  const { t, locale } = useI18n();
  const { colors } = useTheme();
  const { isAdmin } = useAuth();
  const { data: paymentMethods } = usePaymentMethods(isAdmin);
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [paidAt, setPaidAt] = useState(todayIsoDate());
  const [methodId, setMethodId] = useState<string>(CASH_METHOD);
  const [isManual, setIsManual] = useState(false);
  const [allocationTexts, setAllocationTexts] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  const outstanding = useMemo(() => outstandingInstallments(installments), [installments]);
  const totalOutstanding = outstanding.reduce((sum, installment) => sum + remainingOf(installment), 0);

  useEffect(() => {
    if (!visible) {
      return;
    }
    setAmount('');
    setNote('');
    setPaidAt(todayIsoDate());
    setMethodId(CASH_METHOD);
    setIsManual(false);
    setAllocationTexts({});
    setError(null);
  }, [visible]);

  const methodOptions: ChoiceOption<string>[] = [
    { value: CASH_METHOD, label: t('paymentForm.cash'), icon: 'cash-outline' },
    ...(paymentMethods ?? [])
      .filter((method) => method.isActive)
      .map((method) => {
        const preset = resolvePaymentMethodPreset(method.presetKey);
        return { value: method.id, label: method.label, icon: preset.icon, color: preset.color };
      }),
  ];

  const parsedAmount = parseAmountInput(amount);
  const amountMinor = parsedAmount !== null ? toMinorUnits(parsedAmount) : 0;
  const nextInstallment = outstanding[0];

  const manualAllocations: ManualAllocation[] = outstanding
    .map((installment) => {
      const value = parseAmountInput(allocationTexts[installment.id] ?? '');
      return { installmentId: installment.id, amount: value !== null ? toMinorUnits(value) : 0 };
    })
    .filter((allocation) => allocation.amount > 0);
  const allocatedTotal = manualAllocations.reduce((sum, allocation) => sum + allocation.amount, 0);

  const validationError = (): string | null => {
    if (parsedAmount === null) {
      return t('contracts.amountRequired');
    }
    if (isManual && allocatedTotal !== amountMinor) {
      return t('paymentForm.allocationMismatch');
    }
    return null;
  };

  const submit = async () => {
    const message = validationError();
    setError(message);
    if (message) {
      return;
    }
    try {
      await onSubmit({
        contractId,
        amount: amountMinor,
        paymentMethodId: methodId === CASH_METHOD ? undefined : methodId,
        paidAt,
        note: note.trim() || undefined,
        allocations: isManual ? manualAllocations : undefined,
      });
    } catch (submitError) {
      setError(submitError instanceof ApiError ? submitError.message : t('common.genericError'));
    }
  };

  return (
    <BottomSheet visible={visible} onClose={saving ? () => undefined : onClose} title={t('contracts.recordPayment')}>
      <View style={{ gap: spacing.lg }}>
        <TextField
          label={t('contracts.amount')}
          value={amount}
          onChangeText={setAmount}
          keyboardType="decimal-pad"
          placeholder="0"
          error={error ?? undefined}
        />
        {nextInstallment ? (
          <ChoiceChips
            options={[
              {
                value: 'next',
                label: t('paymentForm.nextInstallment', { amount: formatMoney(remainingOf(nextInstallment), locale) }),
                icon: 'flash-outline' as const,
              },
              ...(outstanding.length > 1
                ? [
                    {
                      value: 'full',
                      label: t('paymentForm.fullBalance', { amount: formatMoney(totalOutstanding, locale) }),
                      icon: 'checkmark-done-outline' as const,
                    },
                  ]
                : []),
            ]}
            selected={null}
            onSelect={(choice) =>
              setAmount(toMajorUnitsText(choice === 'next' ? remainingOf(nextInstallment) : totalOutstanding))
            }
          />
        ) : null}

        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            backgroundColor: colors.surfaceMuted,
            borderRadius: radius.md,
            padding: spacing.md,
          }}
        >
          <AppText variant="caption" tone="muted">
            {t('paymentForm.remainingAfter')}
          </AppText>
          <MoneyText minorUnits={Math.max(totalOutstanding - amountMinor, 0)} variant="bodyStrong" />
        </View>

        <View style={{ gap: spacing.xs }}>
          <AppText variant="caption" tone="muted">
            {t('contracts.paymentMethod')}
          </AppText>
          <ChoiceChips options={methodOptions} selected={methodId} onSelect={setMethodId} />
        </View>

        <DateStepper label={t('contracts.date')} value={paidAt} onChange={setPaidAt} maxDate={todayIsoDate()} />

        <TextField label={t('contracts.note')} value={note} onChangeText={setNote} optional multiline maxLength={MAX_NOTE_LENGTH} />

        {outstanding.length > 1 ? (
          <View style={{ gap: spacing.md }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
              <View style={{ flex: 1, gap: 2 }}>
                <AppText variant="bodyStrong">{t('paymentForm.manualAllocation')}</AppText>
                <AppText variant="caption" tone="muted">
                  {t('paymentForm.manualAllocationHint')}
                </AppText>
              </View>
              <Switch
                value={isManual}
                onValueChange={setIsManual}
                trackColor={{ true: colors.primary, false: colors.border }}
                thumbColor={colors.surface}
              />
            </View>
            {isManual ? (
              <ManualAllocationFields
                installments={outstanding}
                values={allocationTexts}
                onChange={(installmentId, text) =>
                  setAllocationTexts((current) => ({ ...current, [installmentId]: text }))
                }
                allocatedTotal={allocatedTotal}
                targetTotal={amountMinor}
              />
            ) : null}
          </View>
        ) : null}

        <Button title={t('common.save')} onPress={() => void submit()} loading={saving} />
      </View>
    </BottomSheet>
  );
}
