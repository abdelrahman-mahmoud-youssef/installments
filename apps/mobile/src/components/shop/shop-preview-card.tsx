import { Image, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '@/components/ui/app-text';
import { Avatar } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import { PressableScale } from '@/components/ui/pressable-scale';
import { resolveAssetUrl } from '@/lib/asset-url';
import { BRAND_COLOR_HEX, BrandColorPreset } from '@/lib/brand-colors';
import { useTheme } from '@/theme/theme-context';
import { radius, spacing } from '@/theme/tokens';

interface ShopPreviewCardProps {
  displayName: string;
  slug: string;
  phone: string;
  brandColor: BrandColorPreset;
  logoUrl: string | null;
  logoActionLabel: string;
  onPressLogo: () => void;
}

const BAND_HEIGHT = 96;
const LOGO_SIZE = 76;
const LOGO_RING = 4;
const EDIT_BADGE_SIZE = 26;

export function ShopPreviewCard({
  displayName,
  slug,
  phone,
  brandColor,
  logoUrl,
  logoActionLabel,
  onPressLogo,
}: ShopPreviewCardProps) {
  const { colors } = useTheme();
  const brandHex = BRAND_COLOR_HEX[brandColor];

  return (
    <Card padded={false} style={{ overflow: 'hidden' }}>
      <View style={{ height: BAND_HEIGHT, backgroundColor: brandHex }}>
        <View
          style={{
            position: 'absolute',
            end: -BAND_HEIGHT / 3,
            top: -BAND_HEIGHT / 2,
            width: BAND_HEIGHT * 1.6,
            height: BAND_HEIGHT * 1.6,
            borderRadius: radius.full,
            backgroundColor: colors.surface,
            opacity: 0.14,
          }}
        />
      </View>
      <View style={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.lg, gap: spacing.md }}>
        <PressableScale
          onPress={onPressLogo}
          accessibilityRole="button"
          accessibilityLabel={logoActionLabel}
          style={{ alignSelf: 'flex-start', marginTop: -LOGO_SIZE / 2 }}
        >
          <View
            style={{
              width: LOGO_SIZE + LOGO_RING * 2,
              height: LOGO_SIZE + LOGO_RING * 2,
              borderRadius: radius.full,
              backgroundColor: colors.surface,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {logoUrl ? (
              <Image
                source={{ uri: resolveAssetUrl(logoUrl) }}
                resizeMode="cover"
                style={{ width: LOGO_SIZE, height: LOGO_SIZE, borderRadius: radius.full }}
              />
            ) : (
              <Avatar name={displayName} size={LOGO_SIZE} />
            )}
          </View>
          <View
            style={{
              position: 'absolute',
              bottom: 0,
              end: 0,
              width: EDIT_BADGE_SIZE,
              height: EDIT_BADGE_SIZE,
              borderRadius: radius.full,
              backgroundColor: brandHex,
              borderWidth: 2,
              borderColor: colors.surface,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons name="camera" size={13} color={colors.surface} />
          </View>
        </PressableScale>
        <View style={{ gap: spacing.xs }}>
          <AppText variant="title" numberOfLines={1}>
            {displayName}
          </AppText>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, flexWrap: 'wrap' }}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: spacing.xs,
                backgroundColor: colors.surfaceMuted,
                borderRadius: radius.full,
                paddingHorizontal: spacing.md,
                paddingVertical: spacing.xs,
              }}
            >
              <Ionicons name="link-outline" size={14} color={colors.textMuted} />
              <AppText variant="label" tone="muted">
                {slug}
              </AppText>
            </View>
            {phone ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
                <Ionicons name="call-outline" size={14} color={colors.textMuted} />
                <AppText variant="caption" tone="muted">
                  {phone}
                </AppText>
              </View>
            ) : null}
          </View>
        </View>
      </View>
    </Card>
  );
}
