import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { ApiError } from '@/api/client';
import { Customer, SaveCustomerInput } from '@/api/customers';
import { AppText } from '@/components/ui/app-text';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { Button } from '@/components/ui/button';
import { ImageSlot } from '@/components/ui/image-slot';
import { TextField } from '@/components/ui/text-field';
import { useI18n } from '@/i18n/i18n-context';
import { PickedImage } from '@/lib/image-picker';
import { spacing } from '@/theme/tokens';

interface CustomerFormSheetProps {
  visible: boolean;
  customer: Customer | null;
  saving: boolean;
  onClose: () => void;
  onSubmit: (input: SaveCustomerInput) => Promise<void>;
}

interface PickedImages {
  photo: PickedImage | null;
  idImageFront: PickedImage | null;
  idImageBack: PickedImage | null;
}

const NO_PICKED_IMAGES: PickedImages = { photo: null, idImageFront: null, idImageBack: null };

export function CustomerFormSheet({ visible, customer, saving, onClose, onSubmit }: CustomerFormSheetProps) {
  const { t } = useI18n();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [images, setImages] = useState<PickedImages>(NO_PICKED_IMAGES);
  const [errors, setErrors] = useState<{ name?: string; phone?: string; api?: string }>({});

  useEffect(() => {
    if (!visible) {
      return;
    }
    setName(customer?.name ?? '');
    setPhone(customer?.phone ?? '');
    setAddress(customer?.address ?? '');
    setNotes(customer?.notes ?? '');
    setImages(NO_PICKED_IMAGES);
    setErrors({});
  }, [visible, customer]);

  const pickImage = (key: keyof PickedImages) => (image: PickedImage) =>
    setImages((current) => ({ ...current, [key]: image }));

  const submit = async () => {
    const nextErrors = {
      name: name.trim() ? undefined : t('common.requiredField'),
      phone: phone.trim() ? undefined : t('common.requiredField'),
    };
    setErrors(nextErrors);
    if (nextErrors.name || nextErrors.phone) {
      return;
    }
    try {
      await onSubmit({
        name: name.trim(),
        phone: phone.trim(),
        address: address.trim(),
        notes: notes.trim(),
        photo: images.photo?.base64,
        idImageFront: images.idImageFront?.base64,
        idImageBack: images.idImageBack?.base64,
      });
    } catch (error) {
      setErrors({ api: error instanceof ApiError ? error.message : t('common.genericError') });
    }
  };

  return (
    <BottomSheet
      visible={visible}
      onClose={saving ? () => undefined : onClose}
      title={customer ? t('customerForm.editTitle') : t('customerForm.newTitle')}
    >
      <View style={{ gap: spacing.lg }}>
        <TextField label={t('customerForm.name')} value={name} onChangeText={setName} error={errors.name} />
        <TextField
          label={t('customerForm.phone')}
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
          error={errors.phone}
        />
        <TextField label={t('customerForm.address')} value={address} onChangeText={setAddress} optional />
        <TextField label={t('customerForm.notes')} value={notes} onChangeText={setNotes} multiline optional />
        <View style={{ flexDirection: 'row', gap: spacing.md }}>
          <ImageSlot
            label={t('customerForm.photo')}
            picked={images.photo}
            existingUrl={customer?.photoUrl}
            onPick={pickImage('photo')}
            square
          />
          <ImageSlot
            label={t('customerForm.idFront')}
            picked={images.idImageFront}
            existingUrl={customer?.idImageFrontUrl}
            onPick={pickImage('idImageFront')}
          />
          <ImageSlot
            label={t('customerForm.idBack')}
            picked={images.idImageBack}
            existingUrl={customer?.idImageBackUrl}
            onPick={pickImage('idImageBack')}
          />
        </View>
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
