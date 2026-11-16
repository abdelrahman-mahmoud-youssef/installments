import { Image } from 'expo-image';
import { View } from 'react-native';
import { resolveThumbnailUrl } from '@/lib/asset-url';
import { initialsOf } from '@/lib/initials';
import { useTheme } from '@/theme/theme-context';
import { radius } from '@/theme/tokens';
import { AppText } from './app-text';

const IMAGE_FADE_IN_MS = 150;

interface AvatarProps {
  name: string;
  size?: number;
  photoUrl?: string | null;
}

export function Avatar({ name, size = 44, photoUrl }: AvatarProps) {
  const { colors, fontSize } = useTheme();
  if (photoUrl) {
    return (
      <Image
        source={{ uri: resolveThumbnailUrl(photoUrl, 200) }}
        accessibilityLabel={name}
        cachePolicy="disk"
        transition={IMAGE_FADE_IN_MS}
        style={{ width: size, height: size, borderRadius: radius.full, backgroundColor: colors.surfaceMuted }}
      />
    );
  }
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: radius.full,
        backgroundColor: colors.primaryMuted,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <AppText style={{ color: colors.primary, fontWeight: '700', fontSize: fontSize('md') }}>
        {initialsOf(name)}
      </AppText>
    </View>
  );
}
