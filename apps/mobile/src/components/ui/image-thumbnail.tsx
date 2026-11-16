import { useState } from 'react';
import { Image } from 'expo-image';
import { Modal, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useI18n } from '@/i18n/i18n-context';
import { resolveAssetUrl, resolveThumbnailUrl } from '@/lib/asset-url';
import { useTheme } from '@/theme/theme-context';
import { radius, spacing, touchTarget } from '@/theme/tokens';
import { PressableScale } from './pressable-scale';

const DEFAULT_THUMBNAIL_SIZE = 40;
const THUMBNAIL_REQUEST_WIDTH = 200;
const VIEWER_BACKDROP = 'rgba(0,0,0,0.92)';
const VIEWER_FOREGROUND = '#ffffff';

interface ImageThumbnailProps {
  path: string;
  label: string;
  size?: number;
}

export function ImageThumbnail({ path, label, size = DEFAULT_THUMBNAIL_SIZE }: ImageThumbnailProps) {
  const { colors } = useTheme();
  const { t, direction } = useI18n();
  const insets = useSafeAreaInsets();
  const [isOpen, setIsOpen] = useState(false);
  const uri = resolveAssetUrl(path);
  const thumbnailUri = resolveThumbnailUrl(path, THUMBNAIL_REQUEST_WIDTH);

  return (
    <>
      <PressableScale
        onPress={() => setIsOpen(true)}
        accessibilityRole="imagebutton"
        accessibilityLabel={label}
        style={{
          width: size,
          height: size,
          borderRadius: radius.sm,
          overflow: 'hidden',
          borderWidth: 1,
          borderColor: colors.border,
        }}
      >
        <Image source={{ uri: thumbnailUri }} cachePolicy="disk" transition={150} style={{ width: '100%', height: '100%' }} />
      </PressableScale>
      <Modal visible={isOpen} transparent animationType="fade" onRequestClose={() => setIsOpen(false)}>
        <View style={{ flex: 1, direction, backgroundColor: VIEWER_BACKDROP, justifyContent: 'center' }}>
          <Image source={{ uri }} contentFit="contain" cachePolicy="disk" style={{ width: '100%', height: '80%' }} />
          <Pressable
            onPress={() => setIsOpen(false)}
            accessibilityRole="button"
            accessibilityLabel={t('common.close')}
            hitSlop={spacing.sm}
            style={{
              position: 'absolute',
              top: insets.top + spacing.md,
              end: spacing.xl,
              width: touchTarget.minHeight,
              height: touchTarget.minHeight,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons name="close-circle" size={32} color={VIEWER_FOREGROUND} />
          </Pressable>
        </View>
      </Modal>
    </>
  );
}
