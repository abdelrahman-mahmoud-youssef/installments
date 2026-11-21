import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { ApiError } from '@/api/client';
import { JameyaDetail, JameyaMember } from '@/api/jameyas';
import { AppText } from '@/components/ui/app-text';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { Button } from '@/components/ui/button';
import { OptionalImageField } from '@/components/ui/optional-image-field';
import { TextField } from '@/components/ui/text-field';
import { useToast } from '@/components/ui/toast-context';
import { useRecordJameyaPayment } from '@/hooks/queries';
import { useI18n } from '@/i18n/i18n-context';
import { formatNumber } from '@/lib/format';
import { base64ByteLength, PickedImage, pickImages } from '@/lib/image-picker';
import { suggestedPaymentOf } from '@/lib/jameya';
import { spacing } from '@/theme/tokens';
import { JAMEYA_NOTE_MAX_LENGTH } from './jameya-limits';
import { useJameyaMoneyEntry } from './use-jameya-money-entry';

const RECEIPT_MAX_MEGABYTES = 5;
const RECEIPT_MAX_BYTES = RECEIPT_MAX_MEGABYTES * 1024 * 1024;

interface JameyaCollectSheetProps {
  jameya: JameyaDetail;
  member: JameyaMember | null;
  onClose: () => void;
}

export function JameyaCollectSheet({ jameya, member, onClose }: JameyaCollectSheetProps) {
  const { t, locale } = useI18n();
  const { showToast } = useToast();
  const recordPayment = useRecordJameyaPayment(jameya.id);
  const visible = member !== null;
  const entry = useJameyaMoneyEntry(visible, {
    customerId: member?.customerId ?? '',
    amount: member ? suggestedPaymentOf(jameya, member.customerId) : 0,
  });
  const [image, setImage] = useState<PickedImage | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      setImage(null);
      setImageError(null);
    }
  }, [visible]);

  const pickImage = async () => {
    const [picked] = await pickImages({ limit: 1 });
    if (picked) {
      setImage(picked);
      setImageError(null);
    }
  };

  const submit = async () => {
    if (!member) {
      return;
    }
    const input = entry.validInput(member.remainingAmount);
    if (!input) {
      return;
    }
    if (image && base64ByteLength(image.base64) > RECEIPT_MAX_BYTES) {
      setImageError(t('support.imageTooLarge', { max: formatNumber(RECEIPT_MAX_MEGABYTES, locale) }));
      return;
    }
    try {
      await recordPayment.mutateAsync({ ...input, image: image?.base64 });
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
      title={member ? t('jameyas.detail.collectTitle', { name: member.name }) : undefined}
    >
      {member ? (
        <View style={{ gap: spacing.lg }}>
          <AppText variant="caption" tone="muted">
            {t('jameyas.paymentDialog.description', { name: member.name })}
          </AppText>
          <TextField
            label={t('jameyas.paymentDialog.amount')}
            value={entry.amountText}
            onChangeText={entry.setAmountText}
            keyboardType="decimal-pad"
            placeholder="0"
            error={entry.error ?? undefined}
          />
          <TextField
            label={t('jameyas.paymentDialog.note')}
            value={entry.note}
            onChangeText={entry.setNote}
            multiline
            maxLength={JAMEYA_NOTE_MAX_LENGTH}
          />
          <OptionalImageField
            label={t('jameyas.detail.receipt')}
            addLabel={t('jameyas.detail.receiptHint')}
            removeLabel={t('support.removeImage')}
            image={image}
            error={imageError ?? undefined}
            onPick={() => void pickImage()}
            onRemove={() => setImage(null)}
          />
          <Button
            title={t('jameyas.detail.recordShort')}
            onPress={() => void submit()}
            loading={recordPayment.isPending}
          />
        </View>
      ) : null}
    </BottomSheet>
  );
}
