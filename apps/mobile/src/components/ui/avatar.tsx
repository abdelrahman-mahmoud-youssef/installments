import { Image, View } from 'react-native';
import { resolveAssetUrl } from '@/lib/asset-url';
import { initialsOf } from '@/lib/initials';
import { useTheme } from '@/theme/theme-context';
import { radius } from '@/theme/tokens';
import { AppText } from './app-text';

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
        source={{ uri: resolveAssetUrl(photoUrl) }}
        accessibilityLabel={name}
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
