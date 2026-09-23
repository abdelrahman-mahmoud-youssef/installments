import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { TenantLocation } from '@/api/branding';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { Button } from '@/components/ui/button';
import { TextField } from '@/components/ui/text-field';
import { useI18n } from '@/i18n/i18n-context';
import { createLocalId } from '@/lib/local-id';
import { spacing } from '@/theme/tokens';

const MAX_NAME_LENGTH = 80;
const MAX_ADDRESS_LENGTH = 300;
const MAX_MAP_URL_LENGTH = 500;
const URL_PATTERN = /^https?:\/\/\S+$/i;

interface LocationFormSheetProps {
  visible: boolean;
  location: TenantLocation | null;
  saving: boolean;
  onClose: () => void;
  onSubmit: (location: TenantLocation) => void;
}

export function LocationFormSheet({ visible, location, saving, onClose, onSubmit }: LocationFormSheetProps) {
  const { t } = useI18n();
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [mapUrl, setMapUrl] = useState('');
  const [errors, setErrors] = useState<{ address?: string; mapUrl?: string }>({});

  useEffect(() => {
    if (!visible) {
      return;
    }
    setName(location?.name ?? '');
    setAddress(location?.address ?? '');
    setMapUrl(location?.mapUrl ?? '');
    setErrors({});
  }, [visible, location]);

  const submit = () => {
    const trimmedMapUrl = mapUrl.trim();
    const nextErrors = {
      address: address.trim() ? undefined : t('common.requiredField'),
      mapUrl: trimmedMapUrl && !URL_PATTERN.test(trimmedMapUrl) ? t('shopExtras.invalidMapUrl') : undefined,
    };
    setErrors(nextErrors);
    if (nextErrors.address || nextErrors.mapUrl) {
      return;
    }
    onSubmit({
      id: location?.id ?? createLocalId(),
      name: name.trim(),
      address: address.trim(),
      mapUrl: trimmedMapUrl || undefined,
    });
  };

  return (
    <BottomSheet
      visible={visible}
      onClose={saving ? () => undefined : onClose}
      title={location ? t('shopExtras.editLocation') : t('shopExtras.addLocation')}
    >
      <View style={{ gap: spacing.lg }}>
        <TextField
          label={t('shopExtras.locationName')}
          placeholder={t('shopExtras.locationNamePlaceholder')}
          value={name}
          onChangeText={setName}
          maxLength={MAX_NAME_LENGTH}
          optional
        />
        <TextField
          label={t('shopExtras.address')}
          value={address}
          onChangeText={setAddress}
          maxLength={MAX_ADDRESS_LENGTH}
          error={errors.address}
          multiline
        />
        <TextField
          label={t('shopExtras.mapUrl')}
          placeholder="https://maps.google.com/…"
          value={mapUrl}
          onChangeText={setMapUrl}
          maxLength={MAX_MAP_URL_LENGTH}
          keyboardType="url"
          autoCapitalize="none"
          autoCorrect={false}
          error={errors.mapUrl}
          optional
        />
        <Button title={t('common.save')} onPress={submit} loading={saving} />
      </View>
    </BottomSheet>
  );
}
