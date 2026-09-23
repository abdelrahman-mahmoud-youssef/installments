import { Image, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { resolveAssetUrl } from '@/lib/asset-url';
import { PickedImage, pickImages } from '@/lib/image-picker';
import { useTheme } from '@/theme/theme-context';
import { radius, spacing } from '@/theme/tokens';
import { AppText } from './app-text';
import { PressableScale } from './pressable-scale';

const SLOT_HEIGHT = 96;

interface ImageSlotProps {
  label: string;
  picked: PickedImage | null;
  existingUrl?: string | null;
  onPick: (image: PickedImage) => void;
  square?: boolean;
}

export function ImageSlot({ label, picked, existingUrl, onPick, square = false }: ImageSlotProps) {
  const { colors } = useTheme();
  const previewUri = picked?.uri ?? (existingUrl ? resolveAssetUrl(existingUrl) : null);

  const choose = async () => {
    const [image] = await pickImages({ limit: 1, square });
    if (image) {
      onPick(image);
    }
  };

  return (
    <View style={{ flex: 1, gap: spacing.xs }}>
      <AppText variant="caption" tone="muted" numberOfLines={1}>
        {label}
      </AppText>
      <PressableScale
        onPress={() => void choose()}
        accessibilityRole="button"
        accessibilityLabel={label}
        style={{
          height: SLOT_HEIGHT,
          borderRadius: radius.md,
          borderWidth: 1.5,
          borderStyle: previewUri ? 'solid' : 'dashed',
          borderColor: colors.border,
          backgroundColor: colors.surface,
          overflow: 'hidden',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {previewUri ? (
          <Image source={{ uri: previewUri }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
        ) : (
          <Ionicons name="camera-outline" size={24} color={colors.textMuted} />
        )}
      </PressableScale>
    </View>
  );
}
