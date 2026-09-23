import { Image, View } from 'react-native';
import { PickedImage } from '@/lib/image-picker';
import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/i18n/i18n-context';
import { useTheme } from '@/theme/theme-context';
import { radius, spacing } from '@/theme/tokens';

const PREVIEW_ASPECT_RATIO = 4 / 3;

interface AnnouncementImageFieldProps {
  image: PickedImage | null;
  error?: string;
  onPick: () => void;
  onRemove: () => void;
}

export function AnnouncementImageField({ image, error, onPick, onRemove }: AnnouncementImageFieldProps) {
  const { t } = useI18n();
  const { colors } = useTheme();

  return (
    <View style={{ gap: spacing.sm }}>
      <View style={{ flexDirection: 'row', gap: spacing.xs, alignItems: 'baseline' }}>
        <AppText variant="caption" tone="muted">
          {t('announcements.image')}
        </AppText>
        <AppText variant="label" tone="faint">
          {t('common.optional')}
        </AppText>
      </View>
      {image ? (
        <Image
          source={{ uri: image.uri }}
          resizeMode="cover"
          accessibilityIgnoresInvertColors
          style={{
            width: '100%',
            aspectRatio: PREVIEW_ASPECT_RATIO,
            borderRadius: radius.md,
            backgroundColor: colors.surfaceMuted,
          }}
        />
      ) : null}
      {image ? (
        <Button title={t('announcements.removeImage')} icon="trash-outline" variant="secondary" onPress={onRemove} />
      ) : (
        <Button title={t('announcements.addImage')} icon="image-outline" variant="secondary" onPress={onPick} />
      )}
      {error ? (
        <AppText variant="caption" tone="danger">
          {error}
        </AppText>
      ) : null}
    </View>
  );
}
