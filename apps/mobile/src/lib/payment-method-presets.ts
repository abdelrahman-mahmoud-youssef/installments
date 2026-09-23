import type { Ionicons } from '@expo/vector-icons';

type IoniconName = keyof typeof Ionicons.glyphMap;

export interface PaymentMethodPreset {
  key: string;
  label: string;
  color: string;
  icon: IoniconName;
  suggestedMonthlyLimit?: number;
}

export const PAYMENT_METHOD_PRESETS: PaymentMethodPreset[] = [
  { key: 'vodafone_cash', label: 'Vodafone Cash', color: '#e60000', icon: 'phone-portrait-outline', suggestedMonthlyLimit: 200000 },
  { key: 'instapay', label: 'InstaPay', color: '#6c2eb5', icon: 'wallet-outline', suggestedMonthlyLimit: 400000 },
  { key: 'fawry', label: 'Fawry', color: '#d9a015', icon: 'cash-outline' },
  { key: 'bank_transfer', label: 'Bank transfer', color: '#475569', icon: 'business-outline' },
  { key: 'orange_cash', label: 'Orange Cash', color: '#ff7900', icon: 'phone-portrait-outline', suggestedMonthlyLimit: 200000 },
  { key: 'etisalat_cash', label: 'Etisalat Cash', color: '#00a651', icon: 'phone-portrait-outline', suggestedMonthlyLimit: 200000 },
  { key: 'we_pay', label: 'WE Pay', color: '#4b2e83', icon: 'phone-portrait-outline', suggestedMonthlyLimit: 200000 },
  { key: 'aman', label: 'Aman', color: '#ef5a28', icon: 'cash-outline' },
];

export const CUSTOM_PRESET_KEY = 'custom';

const FALLBACK_PRESET: PaymentMethodPreset = {
  key: CUSTOM_PRESET_KEY,
  label: 'Custom',
  color: '#64748b',
  icon: 'card-outline',
};

const PRESET_BY_KEY = new Map(PAYMENT_METHOD_PRESETS.map((preset) => [preset.key, preset]));

export function resolvePaymentMethodPreset(presetKey: string | null): PaymentMethodPreset {
  return (presetKey && PRESET_BY_KEY.get(presetKey)) || FALLBACK_PRESET;
}
