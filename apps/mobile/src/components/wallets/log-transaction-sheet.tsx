import { useEffect, useMemo, useState } from 'react';
import { Image, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ApiError } from '@/api/client';
import { Counterparty } from '@/api/counterparties';
import { MoneyDirection } from '@/api/payment-method-transactions';
import { AppText } from '@/components/ui/app-text';
import { Avatar } from '@/components/ui/avatar';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { Button } from '@/components/ui/button';
import { DateStepper } from '@/components/ui/date-stepper';
import { PressableScale } from '@/components/ui/pressable-scale';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { TextField } from '@/components/ui/text-field';
import { useToast } from '@/components/ui/toast-context';
import { useCounterparties, useCreatePaymentMethodTransaction, usePaymentMethods } from '@/hooks/queries';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { useI18n } from '@/i18n/i18n-context';
import { isolateLtr, parseAmountInput, todayIsoDate, toMinorUnits } from '@/lib/format';
import { PickedImage, pickImages } from '@/lib/image-picker';
import { resolvePaymentMethodPreset } from '@/lib/payment-method-presets';
import { useTheme } from '@/theme/theme-context';
import { radius, spacing } from '@/theme/tokens';

const MAX_SUGGESTIONS = 4;
const RECEIPT_PREVIEW_SIZE = 56;

type FixedCounterparty = Pick<Counterparty, 'id' | 'name' | 'phone'>;

interface LogTransactionSheetProps {
  visible: boolean;
  onClose: () => void;
  paymentMethodId?: string;
  counterparty?: FixedCounterparty;
}

interface FormErrors {
  wallet?: string;
  amount?: string;
  api?: string;
}

export function LogTransactionSheet({ visible, onClose, paymentMethodId, counterparty }: LogTransactionSheetProps) {
  const { t } = useI18n();
  const { colors } = useTheme();
  const { showToast } = useToast();
  const { data: paymentMethods } = usePaymentMethods();
  const createMutation = useCreatePaymentMethodTransaction();

  const [selectedMethodId, setSelectedMethodId] = useState<string | undefined>(undefined);
  const [direction, setDirection] = useState<MoneyDirection>('OUT');
  const [amount, setAmount] = useState('');
  const [occurredAt, setOccurredAt] = useState(todayIsoDate());
  const [counterpartyId, setCounterpartyId] = useState<string | undefined>(undefined);
  const [counterpartyName, setCounterpartyName] = useState('');
  const [counterpartyPhone, setCounterpartyPhone] = useState('');
  const [note, setNote] = useState('');
  const [receipt, setReceipt] = useState<PickedImage | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});

  useEffect(() => {
    if (!visible) {
      return;
    }
    setSelectedMethodId(undefined);
    setDirection('OUT');
    setAmount('');
    setOccurredAt(todayIsoDate());
    setCounterpartyId(undefined);
    setCounterpartyName('');
    setCounterpartyPhone('');
    setNote('');
    setReceipt(null);
    setErrors({});
  }, [visible]);

  const activeMethods = useMemo(() => (paymentMethods ?? []).filter((method) => method.isActive), [paymentMethods]);
  const resolvedMethodId = paymentMethodId ?? selectedMethodId;

  const debouncedName = useDebouncedValue(counterpartyName.trim());
  const shouldSuggest = visible && !counterparty && !counterpartyId && debouncedName.length > 0;
  const suggestionsQuery = useCounterparties({ q: debouncedName }, shouldSuggest);
  const suggestions = shouldSuggest
    ? (suggestionsQuery.data?.pages[0]?.data ?? []).slice(0, MAX_SUGGESTIONS)
    : [];

  const changeCounterpartyName = (name: string) => {
    setCounterpartyName(name);
    setCounterpartyId(undefined);
  };

  const chooseSuggestion = (suggestion: Counterparty) => {
    setCounterpartyId(suggestion.id);
    setCounterpartyName(suggestion.name);
    setCounterpartyPhone(suggestion.phone ?? '');
  };

  const attachReceipt = async () => {
    const [picked] = await pickImages({ limit: 1 });
    if (picked) {
      setReceipt(picked);
    }
  };

  const submit = async () => {
    const parsedAmount = parseAmountInput(amount);
    const nextErrors: FormErrors = {
      wallet: resolvedMethodId ? undefined : t('transactions.walletRequired'),
      amount: parsedAmount === null ? t('transactions.amountRequired') : undefined,
    };
    setErrors(nextErrors);
    if (!resolvedMethodId || parsedAmount === null) {
      return;
    }
    try {
      await createMutation.mutateAsync({
        paymentMethodId: resolvedMethodId,
        input: {
          direction,
          amount: toMinorUnits(parsedAmount),
          occurredAt,
          counterpartyId: counterparty?.id ?? counterpartyId,
          counterpartyName: counterparty ? counterparty.name : counterpartyName.trim() || undefined,
          counterpartyPhone: counterparty ? (counterparty.phone ?? undefined) : counterpartyPhone.trim() || undefined,
          note: note.trim() || undefined,
          image: receipt?.base64,
        },
      });
      showToast(t('transactions.logged'));
      onClose();
    } catch (error) {
      setErrors({ api: error instanceof ApiError ? error.message : t('common.genericError') });
    }
  };

  const isSaving = createMutation.isPending;

  return (
    <BottomSheet visible={visible} onClose={isSaving ? () => undefined : onClose} title={t('transactions.log')}>
      <View style={{ gap: spacing.lg }}>
        {!paymentMethodId ? (
          <View style={{ gap: spacing.xs }}>
            <AppText variant="caption" tone="muted">
              {t('transactions.wallet')}
            </AppText>
            {activeMethods.length === 0 ? (
              <AppText variant="caption" tone="danger">
                {t('transactions.noActiveWallets')}
              </AppText>
            ) : (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
                {activeMethods.map((method) => {
                  const preset = resolvePaymentMethodPreset(method.presetKey);
                  const isSelected = selectedMethodId === method.id;
                  return (
                    <PressableScale
                      key={method.id}
                      onPress={() => setSelectedMethodId(method.id)}
                      accessibilityRole="button"
                      accessibilityState={{ selected: isSelected }}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: spacing.xs,
                        borderWidth: 1.5,
                        borderColor: isSelected ? preset.color : colors.border,
                        backgroundColor: isSelected ? `${preset.color}14` : colors.surface,
                        borderRadius: radius.full,
                        paddingHorizontal: spacing.md,
                        paddingVertical: spacing.sm,
                      }}
                    >
                      <Ionicons name={preset.icon} size={14} color={preset.color} />
                      <AppText variant="caption">{method.label}</AppText>
                    </PressableScale>
                  );
                })}
              </View>
            )}
            {errors.wallet ? (
              <AppText variant="caption" tone="danger">
                {errors.wallet}
              </AppText>
            ) : null}
          </View>
        ) : null}

        <SegmentedControl
          options={[
            { value: 'OUT', label: t('transactions.sent'), icon: 'arrow-up', activeColor: colors.danger },
            { value: 'IN', label: t('transactions.received'), icon: 'arrow-down', activeColor: colors.success },
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
          error={errors.amount}
        />

        <DateStepper
          label={t('transactions.date')}
          value={occurredAt}
          onChange={setOccurredAt}
          maxDate={todayIsoDate()}
        />

        {counterparty ? (
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: spacing.md,
              backgroundColor: colors.surfaceMuted,
              borderRadius: radius.md,
              padding: spacing.md,
            }}
          >
            <Avatar name={counterparty.name} size={36} />
            <View style={{ flex: 1 }}>
              <AppText variant="caption" tone="muted">
                {direction === 'OUT' ? t('transactions.sentTo') : t('transactions.receivedFrom')}
              </AppText>
              <AppText variant="bodyStrong">{counterparty.name}</AppText>
            </View>
          </View>
        ) : (
          <View style={{ gap: spacing.sm }}>
            <TextField
              label={direction === 'OUT' ? t('transactions.sentTo') : t('transactions.receivedFrom')}
              placeholder={t('transactions.counterpartyPlaceholder')}
              value={counterpartyName}
              onChangeText={changeCounterpartyName}
              autoCorrect={false}
              optional
            />
            {suggestions.map((suggestion) => (
              <PressableScale
                key={suggestion.id}
                onPress={() => chooseSuggestion(suggestion)}
                accessibilityRole="button"
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: spacing.md,
                  paddingHorizontal: spacing.md,
                  paddingVertical: spacing.sm,
                  borderRadius: radius.md,
                  backgroundColor: colors.surfaceMuted,
                }}
              >
                <Avatar name={suggestion.name} photoUrl={suggestion.photoUrl} size={32} />
                <View style={{ flex: 1 }}>
                  <AppText variant="caption">{suggestion.name}</AppText>
                  {suggestion.phone ? (
                    <AppText variant="label" tone="muted">
                      {isolateLtr(suggestion.phone)}
                    </AppText>
                  ) : null}
                </View>
                <Ionicons name="person-add-outline" size={16} color={colors.primary} />
              </PressableScale>
            ))}
            <TextField
              label={t('transactions.counterpartyPhone')}
              value={counterpartyPhone}
              onChangeText={setCounterpartyPhone}
              keyboardType="phone-pad"
              optional
            />
          </View>
        )}

        <TextField label={t('transactions.note')} value={note} onChangeText={setNote} multiline optional />

        <View style={{ gap: spacing.xs }}>
          <AppText variant="caption" tone="muted">
            {t('transactions.receipt')}
          </AppText>
          {receipt ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
              <Image
                source={{ uri: receipt.uri }}
                style={{ width: RECEIPT_PREVIEW_SIZE, height: RECEIPT_PREVIEW_SIZE, borderRadius: radius.sm }}
              />
              <Button
                title={t('transactions.removeReceipt')}
                variant="ghost"
                icon="close-circle-outline"
                onPress={() => setReceipt(null)}
              />
            </View>
          ) : (
            <PressableScale
              onPress={() => void attachReceipt()}
              accessibilityRole="button"
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: spacing.sm,
                borderWidth: 1.5,
                borderStyle: 'dashed',
                borderColor: colors.border,
                borderRadius: radius.md,
                padding: spacing.lg,
              }}
            >
              <Ionicons name="image-outline" size={20} color={colors.textMuted} />
              <AppText variant="caption" tone="muted">
                {t('transactions.attachReceipt')}
              </AppText>
            </PressableScale>
          )}
        </View>

        {errors.api ? (
          <AppText variant="caption" tone="danger">
            {errors.api}
          </AppText>
        ) : null}
        <Button
          title={t('transactions.log')}
          onPress={() => void submit()}
          loading={isSaving}
          disabled={!paymentMethodId && activeMethods.length === 0}
        />
      </View>
    </BottomSheet>
  );
}
