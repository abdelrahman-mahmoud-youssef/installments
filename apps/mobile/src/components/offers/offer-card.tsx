import { Image, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Offer } from '@/api/offers';
import { AppText } from '@/components/ui/app-text';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { PressableScale } from '@/components/ui/pressable-scale';
import { useI18n } from '@/i18n/i18n-context';
import { resolveAssetUrl } from '@/lib/asset-url';
import { formatNumber } from '@/lib/format';
import { useTheme } from '@/theme/theme-context';
import { radius, spacing } from '@/theme/tokens';

interface OfferCardProps {
  offer: Offer;
  onPress: () => void;
}

const COVER_ASPECT_RATIO = 4 / 5;
const HIDDEN_COVER_OPACITY = 0.55;

export function OfferCard({ offer, onPress }: OfferCardProps) {
  const { colors } = useTheme();
  const { t, locale } = useI18n();
  const cover = offer.images[0];

  return (
    <PressableScale onPress={onPress} accessibilityRole="button" accessibilityLabel={offer.title} style={{ flex: 1 }}>
      <Card padded={false} style={{ overflow: 'hidden' }}>
        <View style={{ aspectRatio: COVER_ASPECT_RATIO, backgroundColor: colors.surfaceMuted }}>
          {cover ? (
            <Image
              source={{ uri: resolveAssetUrl(cover) }}
              resizeMode="cover"
              style={{ width: '100%', height: '100%', opacity: offer.isActive ? 1 : HIDDEN_COVER_OPACITY }}
            />
          ) : null}
          <View
            style={{
              position: 'absolute',
              top: spacing.sm,
              start: spacing.sm,
              end: spacing.sm,
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            {offer.isActive ? <View /> : <Badge label={t('offers.hidden')} tone="neutral" />}
            {offer.images.length > 1 ? (
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: spacing.xs,
                  backgroundColor: colors.overlay,
                  borderRadius: radius.full,
                  paddingHorizontal: spacing.sm,
                  paddingVertical: spacing.xs,
                }}
              >
                <Ionicons name="images-outline" size={12} color={colors.surface} />
                <AppText variant="label" style={{ color: colors.surface }}>
                  {formatNumber(offer.images.length, locale)}
                </AppText>
              </View>
            ) : null}
          </View>
        </View>
        <View style={{ padding: spacing.md, gap: spacing.sm }}>
          <AppText variant="bodyStrong" numberOfLines={2}>
            {offer.title}
          </AppText>
          {offer.tag ? <Badge label={offer.tag} tone="primary" /> : null}
        </View>
      </Card>
    </PressableScale>
  );
}
