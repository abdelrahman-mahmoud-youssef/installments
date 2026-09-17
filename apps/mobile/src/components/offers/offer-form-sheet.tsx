import { useEffect, useState } from 'react';
import { Image, Pressable, ScrollView, Switch, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ApiError } from '@/api/client';
import { MAX_OFFER_IMAGES, Offer, SaveOfferInput } from '@/api/offers';
import { AppText } from '@/components/ui/app-text';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { Button } from '@/components/ui/button';
import { PressableScale } from '@/components/ui/pressable-scale';
import { TextField } from '@/components/ui/text-field';
import { useI18n } from '@/i18n/i18n-context';
import { resolveAssetUrl } from '@/lib/asset-url';
import { formatNumber } from '@/lib/format';
import { PickedImage, pickImages } from '@/lib/image-picker';
import { useTheme } from '@/theme/theme-context';
import { radius, spacing } from '@/theme/tokens';

interface OfferFormSheetProps {
  visible: boolean;
  offer: Offer | null;
  saving: boolean;
  onClose: () => void;
  onSubmit: (input: SaveOfferInput) => Promise<void>;
}

const THUMBNAIL_SIZE = 84;
const REMOVE_BUTTON_SIZE = 22;

interface PhotoThumbnailProps {
  uri: string;
  onRemove: () => void;
  removeLabel: string;
}

function PhotoThumbnail({ uri, onRemove, removeLabel }: PhotoThumbnailProps) {
  const { colors } = useTheme();
  return (
    <View style={{ width: THUMBNAIL_SIZE, height: THUMBNAIL_SIZE }}>
      <Image
        source={{ uri }}
        resizeMode="cover"
        style={{ width: '100%', height: '100%', borderRadius: radius.md, backgroundColor: colors.surfaceMuted }}
      />
      <Pressable
        onPress={onRemove}
        hitSlop={spacing.sm}
        accessibilityRole="button"
        accessibilityLabel={removeLabel}
        style={{
          position: 'absolute',
          top: -spacing.xs,
          end: -spacing.xs,
          width: REMOVE_BUTTON_SIZE,
          height: REMOVE_BUTTON_SIZE,
          borderRadius: radius.full,
          backgroundColor: colors.text,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Ionicons name="close" size={14} color={colors.background} />
      </Pressable>
    </View>
  );
}

export function OfferFormSheet({ visible, offer, saving, onClose, onSubmit }: OfferFormSheetProps) {
  const { t, locale } = useI18n();
  const { colors } = useTheme();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tag, setTag] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [keptImages, setKeptImages] = useState<string[]>([]);
  const [newImages, setNewImages] = useState<PickedImage[]>([]);
  const [errors, setErrors] = useState<{ title?: string; images?: string; api?: string }>({});

  useEffect(() => {
    if (!visible) {
      return;
    }
    setErrors({});
    setNewImages([]);
    setTitle(offer?.title ?? '');
    setDescription(offer?.description ?? '');
    setTag(offer?.tag ?? '');
    setIsActive(offer?.isActive ?? true);
    setKeptImages(offer?.images ?? []);
  }, [visible, offer]);

  const totalImages = keptImages.length + newImages.length;
  const canAddMore = totalImages < MAX_OFFER_IMAGES;

  const addPhotos = async () => {
    const picked = await pickImages({ limit: MAX_OFFER_IMAGES - totalImages });
    if (picked.length > 0) {
      setNewImages((current) => [...current, ...picked]);
      setErrors((current) => ({ ...current, images: undefined }));
    }
  };

  const submit = async () => {
    const nextErrors: typeof errors = {};
    if (!title.trim()) {
      nextErrors.title = t('common.requiredField');
    }
    if (totalImages === 0) {
      nextErrors.images = t('offers.photoRequired');
    }
    setErrors(nextErrors);
    if (nextErrors.title || nextErrors.images) {
      return;
    }
    try {
      await onSubmit({
        title: title.trim(),
        description: description.trim() || undefined,
        tag: tag.trim() || undefined,
        isActive,
        images: keptImages,
        newImages: newImages.map((image) => image.base64),
      });
    } catch (error) {
      setErrors({ api: error instanceof ApiError ? error.message : t('common.genericError') });
    }
  };

  return (
    <BottomSheet
      visible={visible}
      onClose={saving ? () => undefined : onClose}
      title={offer ? t('offers.editOffer') : t('offers.newOffer')}
    >
      <View style={{ gap: spacing.lg }}>
        <View style={{ gap: spacing.xs }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <AppText variant="caption" tone="muted">
              {t('offers.photos')}
            </AppText>
            <AppText variant="label" tone="faint">
              {t('offers.photosHint', { max: formatNumber(MAX_OFFER_IMAGES, locale) })}
            </AppText>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: spacing.md, paddingVertical: spacing.xs, paddingEnd: spacing.sm }}
          >
            {keptImages.map((image) => (
              <PhotoThumbnail
                key={image}
                uri={resolveAssetUrl(image)}
                removeLabel={t('offers.removePhoto')}
                onRemove={() => setKeptImages((current) => current.filter((item) => item !== image))}
              />
            ))}
            {newImages.map((image) => (
              <PhotoThumbnail
                key={image.uri}
                uri={image.uri}
                removeLabel={t('offers.removePhoto')}
                onRemove={() => setNewImages((current) => current.filter((item) => item.uri !== image.uri))}
              />
            ))}
            {canAddMore ? (
              <PressableScale
                onPress={() => void addPhotos()}
                accessibilityRole="button"
                accessibilityLabel={t('offers.addPhotos')}
                style={{
                  width: THUMBNAIL_SIZE,
                  height: THUMBNAIL_SIZE,
                  borderRadius: radius.md,
                  borderWidth: 1.5,
                  borderStyle: 'dashed',
                  borderColor: errors.images ? colors.danger : colors.primary,
                  backgroundColor: colors.primaryMuted,
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: spacing.xs,
                }}
              >
                <Ionicons name="add" size={24} color={colors.primary} />
                <AppText variant="label" tone="primary">
                  {t('offers.addPhotos')}
                </AppText>
              </PressableScale>
            ) : null}
          </ScrollView>
          {errors.images ? (
            <AppText variant="caption" tone="danger">
              {errors.images}
            </AppText>
          ) : null}
        </View>

        <TextField
          label={t('offers.offerTitle')}
          placeholder={t('offers.titlePlaceholder')}
          value={title}
          onChangeText={setTitle}
          error={errors.title}
          maxLength={100}
        />
        <TextField
          label={t('offers.description')}
          placeholder={t('offers.descriptionPlaceholder')}
          value={description}
          onChangeText={setDescription}
          multiline
          maxLength={500}
          optional
        />
        <TextField
          label={t('offers.tag')}
          placeholder={t('offers.tagPlaceholder')}
          value={tag}
          onChangeText={setTag}
          maxLength={30}
          optional
        />

        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md }}>
          <AppText>{t('offers.activeOnShop')}</AppText>
          <Switch
            value={isActive}
            onValueChange={setIsActive}
            trackColor={{ true: colors.primary, false: colors.border }}
            thumbColor={colors.surface}
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
