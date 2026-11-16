import type { Ionicons } from '@expo/vector-icons';
import type { ImageSourcePropType } from 'react-native';

type IoniconName = keyof typeof Ionicons.glyphMap;

export interface PaymentMethodPreset {
  key: string;
  label: string;
  color: string;
  icon: IoniconName;
  image?: ImageSourcePropType;
  suggestedMonthlyLimit?: number;
}

export const PAYMENT_METHOD_PRESETS: PaymentMethodPreset[] = [
  { key: 'vodafone_cash', label: 'Vodafone Cash', color: '#e60000', icon: 'phone-portrait-outline', suggestedMonthlyLimit: 200000, image: require('../../assets/payment-methods/vodafone_cash.png') },
  { key: 'instapay', label: 'InstaPay', color: '#6c2eb5', icon: 'wallet-outline', suggestedMonthlyLimit: 400000, image: require('../../assets/payment-methods/instapay.png') },
  { key: 'fawry', label: 'Fawry', color: '#d9a015', icon: 'cash-outline', image: require('../../assets/payment-methods/fawry.png') },
  { key: 'bank_transfer', label: 'Bank transfer', color: '#475569', icon: 'business-outline' },
  { key: 'orange_cash', label: 'Orange Cash', color: '#ff7900', icon: 'phone-portrait-outline', suggestedMonthlyLimit: 200000, image: require('../../assets/payment-methods/orange_cash.png') },
  { key: 'etisalat_cash', label: 'Etisalat Cash', color: '#00a651', icon: 'phone-portrait-outline', suggestedMonthlyLimit: 200000, image: require('../../assets/payment-methods/etisalat_cash.png') },
  { key: 'we_pay', label: 'WE Pay', color: '#4b2e83', icon: 'phone-portrait-outline', suggestedMonthlyLimit: 200000, image: require('../../assets/payment-methods/we_pay.png') },
  { key: 'aman', label: 'Aman', color: '#ef5a28', icon: 'cash-outline', image: require('../../assets/payment-methods/aman.png') },
];

export const CUSTOM_PRESET_KEY = 'custom';

export const PAYMENT_METHOD_ICON_OPTIONS: { key: string; icon: IoniconName }[] = [
  { key: 'wallet', icon: 'wallet-outline' },
  { key: 'card', icon: 'card-outline' },
  { key: 'cash', icon: 'cash-outline' },
  { key: 'bank', icon: 'business-outline' },
  { key: 'phone', icon: 'phone-portrait-outline' },
  { key: 'gift', icon: 'gift-outline' },
  { key: 'cart', icon: 'cart-outline' },
  { key: 'store', icon: 'storefront-outline' },
  { key: 'briefcase', icon: 'briefcase-outline' },
  { key: 'globe', icon: 'globe-outline' },
];

const FALLBACK_PRESET: PaymentMethodPreset = {
  key: CUSTOM_PRESET_KEY,
  label: 'Custom',
  color: '#64748b',
  icon: 'card-outline',
};

const PRESET_BY_KEY = new Map(PAYMENT_METHOD_PRESETS.map((preset) => [preset.key, preset]));

const ICON_BY_KEY = new Map(PAYMENT_METHOD_ICON_OPTIONS.map((option) => [option.key, option.icon]));

export function resolvePaymentMethodPreset(
  presetKey: string | null,
  iconKey: string | null = null,
): PaymentMethodPreset {
  const preset = presetKey ? PRESET_BY_KEY.get(presetKey) : undefined;
  if (preset) {
    return preset;
  }
  const icon = iconKey ? ICON_BY_KEY.get(iconKey) : undefined;
  return icon ? { ...FALLBACK_PRESET, icon } : FALLBACK_PRESET;
}
