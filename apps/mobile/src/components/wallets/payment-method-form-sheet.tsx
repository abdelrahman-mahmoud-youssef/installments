import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ApiError } from '@/api/client';
import { CreatePaymentMethodInput, PaymentMethod, UpdatePaymentMethodInput } from '@/api/payment-methods';
import { AppText } from '@/components/ui/app-text';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { Button } from '@/components/ui/button';
import { PressableScale } from '@/components/ui/pressable-scale';
import { TextField } from '@/components/ui/text-field';
import { useI18n } from '@/i18n/i18n-context';
import { toMinorUnits } from '@/lib/format';
import { PAYMENT_METHOD_PRESETS, resolvePaymentMethodPreset } from '@/lib/payment-method-presets';
import { useTheme } from '@/theme/theme-context';
import { radius, spacing } from '@/theme/tokens';

const CUSTOM_PRESET_KEY = 'custom';

interface PaymentMethodFormSheetProps {
  visible: boolean;
  method: PaymentMethod | null;
  saving: boolean;
  onClose: () => void;
  onCreate: (input: CreatePaymentMethodInput) => Promise<void>;
  onUpdate: (id: string, input: UpdatePaymentMethodInput) => Promise<void>;
}

export function PaymentMethodFormSheet({
  visible,
  method,
  saving,
  onClose,
  onCreate,
  onUpdate,
}: PaymentMethodFormSheetProps) {
  const { t } = useI18n();
  const { colors } = useTheme();
  const [presetKey, setPresetKey] = useState(CUSTOM_PRESET_KEY);
  const [label, setLabel] = useState('');
  const [details, setDetails] = useState('');
  const [monthlyLimit, setMonthlyLimit] = useState('');
  const [errors, setErrors] = useState<{ label?: string; details?: string; api?: string }>({});

  useEffect(() => {
    if (!visible) {
      return;
    }
    setErrors({});
    if (method) {
      setPresetKey(method.presetKey ?? CUSTOM_PRESET_KEY);
      setLabel(method.label);
      setDetails(method.details);
      setMonthlyLimit(method.monthlyLimit !== null ? String(method.monthlyLimit / 100) : '');
    } else {
      setPresetKey(CUSTOM_PRESET_KEY);
      setLabel('');
      setDetails('');
      setMonthlyLimit('');
    }
  }, [visible, method]);

  const selectPreset = (key: string) => {
    setPresetKey(key);
    if (!method && key !== CUSTOM_PRESET_KEY) {
      const preset = resolvePaymentMethodPreset(key);
      setLabel(preset.label);
      if (preset.suggestedMonthlyLimit) {
        setMonthlyLimit(String(preset.suggestedMonthlyLimit / 100));
      }
    }
  };

  const submit = async () => {
    const nextErrors: typeof errors = {};
    if (!label.trim()) {
      nextErrors.label = t('common.requiredField');
    }
    if (!details.trim()) {
      nextErrors.details = t('common.requiredField');
    }
    setErrors(nextErrors);
    if (nextErrors.label || nextErrors.details) {
      return;
    }
    const parsedLimit = Number(monthlyLimit);
    const limitMinorUnits =
      monthlyLimit.trim() && Number.isFinite(parsedLimit) && parsedLimit > 0
        ? toMinorUnits(parsedLimit)
        : undefined;
    try {
      if (method) {
        await onUpdate(method.id, {
          label: label.trim(),
          details: details.trim(),
          monthlyLimit: limitMinorUnits ?? null,
        });
      } else {
        await onCreate({
          label: label.trim(),
          details: details.trim(),
          presetKey: presetKey !== CUSTOM_PRESET_KEY ? presetKey : undefined,
          monthlyLimit: limitMinorUnits,
        });
      }
    } catch (error) {
      setErrors({ api: error instanceof ApiError ? error.message : t('common.genericError') });
    }
  };

  const typeOptions = [
    ...PAYMENT_METHOD_PRESETS,
    { ...resolvePaymentMethodPreset(null), label: t('wallets.customType') },
  ];

  return (
    <BottomSheet
      visible={visible}
      onClose={saving ? () => undefined : onClose}
      title={method ? t('wallets.editMethod') : t('wallets.addMethod')}
    >
      <View style={{ gap: spacing.lg }}>
        {!method ? (
          <View style={{ gap: spacing.xs }}>
            <AppText variant="caption" tone="muted">
              {t('wallets.type')}
            </AppText>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
              {typeOptions.map((preset) => {
                const isSelected = presetKey === preset.key;
                return (
                  <PressableScale
                    key={preset.key}
                    onPress={() => selectPreset(preset.key)}
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
                    <AppText variant="caption">{preset.label}</AppText>
                  </PressableScale>
                );
              })}
            </View>
          </View>
        ) : null}

        <TextField
          label={t('wallets.label')}
          placeholder={t('wallets.labelPlaceholder')}
          value={label}
          onChangeText={setLabel}
          error={errors.label}
        />
        <TextField
          label={t('wallets.details')}
          placeholder={t('wallets.detailsPlaceholder')}
          value={details}
          onChangeText={setDetails}
          error={errors.details}
          keyboardType="numbers-and-punctuation"
        />
        <TextField
          label={t('wallets.monthlyLimit')}
          placeholder={t('wallets.limitPlaceholder')}
          value={monthlyLimit}
          onChangeText={setMonthlyLimit}
          keyboardType="decimal-pad"
          optional
        />
        {errors.api ? (
          <AppText variant="caption" tone="danger">
            {errors.api}
          </AppText>
        ) : null}
        <Button title={t('common.save')} onPress={() => void submit()} loading={saving} />
      </View>
    </BottomSheet>
  );
}
