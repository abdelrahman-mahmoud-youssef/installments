import { Image, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PaymentMethodPreset } from '@/lib/payment-method-presets';
import { useTheme } from '@/theme/theme-context';

const GLYPH_SHARE_OF_SIZE = 0.5;

interface WalletIconProps {
  preset: PaymentMethodPreset;
  size: number;
  borderRadius: number;
}

export function WalletIcon({ preset, size, borderRadius }: WalletIconProps) {
  const { colors } = useTheme();
  const frame = { width: size, height: size, borderRadius, overflow: 'hidden' as const };

  if (preset.image) {
    return (
      <View style={[frame, { borderWidth: 1, borderColor: colors.border }]}>
        <Image source={preset.image} style={{ width: size, height: size }} resizeMode="cover" />
      </View>
    );
  }

  return (
    <View style={[frame, { backgroundColor: `${preset.color}1f`, alignItems: 'center', justifyContent: 'center' }]}>
      <Ionicons name={preset.icon} size={Math.round(size * GLYPH_SHARE_OF_SIZE)} color={preset.color} />
    </View>
  );
}
