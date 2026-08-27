import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { ApiError } from '@/api/client';
import { CreateCustomerInput } from '@/api/customers';
import { AppText } from '@/components/ui/app-text';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { Button } from '@/components/ui/button';
import { TextField } from '@/components/ui/text-field';
import { useI18n } from '@/i18n/i18n-context';
import { spacing } from '@/theme/tokens';

interface CustomerFormSheetProps {
  visible: boolean;
  saving: boolean;
  onClose: () => void;
  onSubmit: (input: CreateCustomerInput) => Promise<void>;
}

export function CustomerFormSheet({ visible, saving, onClose, onSubmit }: CustomerFormSheetProps) {
  const { t } = useI18n();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<{ name?: string; phone?: string; api?: string }>({});

  useEffect(() => {
    if (visible) {
      setName('');
      setPhone('');
      setAddress('');
      setNotes('');
      setErrors({});
    }
  }, [visible]);

  const submit = async () => {
    const nextErrors: typeof errors = {};
    if (!name.trim()) {
      nextErrors.name = t('common.requiredField');
    }
    if (!phone.trim()) {
      nextErrors.phone = t('common.requiredField');
    }
    setErrors(nextErrors);
    if (nextErrors.name || nextErrors.phone) {
      return;
    }
    try {
      await onSubmit({
        name: name.trim(),
        phone: phone.trim(),
        address: address.trim() || undefined,
        notes: notes.trim() || undefined,
      });
    } catch (error) {
      setErrors({ api: error instanceof ApiError ? error.message : t('common.genericError') });
    }
  };

  return (
    <BottomSheet
      visible={visible}
      onClose={saving ? () => undefined : onClose}
      title={t('customers.addCustomer')}
    >
      <View style={{ gap: spacing.lg }}>
        <TextField label={t('customers.name')} value={name} onChangeText={setName} error={errors.name} />
        <TextField
          label={t('customers.phone')}
          value={phone}
          onChangeText={setPhone}
          error={errors.phone}
          keyboardType="phone-pad"
        />
        <TextField label={t('customers.address')} value={address} onChangeText={setAddress} optional />
        <TextField label={t('customers.notes')} value={notes} onChangeText={setNotes} optional multiline />
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
