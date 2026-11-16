import {
  Banknote,
  Briefcase,
  CreditCard,
  Gift,
  Globe,
  Landmark,
  ShoppingCart,
  Smartphone,
  Store,
  Wallet,
  type LucideIcon,
} from 'lucide-react';

export interface PaymentMethodPreset {
  key: string;
  label: string;
  color: string;
  icon: LucideIcon;
  iconSrc?: string;
  suggestedMonthlyLimit?: number;
}

export const PAYMENT_METHOD_PRESETS: PaymentMethodPreset[] = [
  {
    key: 'vodafone_cash',
    label: 'Vodafone Cash',
    color: '#e60000',
    icon: Smartphone,
    iconSrc: '/payment-methods/vodafone_cash.png',
    suggestedMonthlyLimit: 200000,
  },
  {
    key: 'instapay',
    label: 'InstaPay',
    color: '#6c2eb5',
    icon: Wallet,
    iconSrc: '/payment-methods/instapay.png',
    suggestedMonthlyLimit: 400000,
  },
  { key: 'fawry', label: 'Fawry', color: '#fbbf24', icon: Banknote, iconSrc: '/payment-methods/fawry.png' },
  { key: 'bank_transfer', label: 'Bank transfer', color: '#475569', icon: Landmark },
  {
    key: 'orange_cash',
    label: 'Orange Cash',
    color: '#ff7900',
    icon: Smartphone,
    iconSrc: '/payment-methods/orange_cash.png',
    suggestedMonthlyLimit: 200000,
  },
  {
    key: 'etisalat_cash',
    label: 'Etisalat Cash',
    color: '#00a651',
    icon: Smartphone,
    iconSrc: '/payment-methods/etisalat_cash.png',
    suggestedMonthlyLimit: 200000,
  },
  {
    key: 'we_pay',
    label: 'WE Pay',
    color: '#4b2e83',
    icon: Smartphone,
    iconSrc: '/payment-methods/we_pay.png',
    suggestedMonthlyLimit: 200000,
  },
  { key: 'aman', label: 'Aman', color: '#ef5a28', icon: Banknote, iconSrc: '/payment-methods/aman.png' },
];

export const PAYMENT_METHOD_ICON_OPTIONS: { key: string; icon: LucideIcon }[] = [
  { key: 'wallet', icon: Wallet },
  { key: 'card', icon: CreditCard },
  { key: 'cash', icon: Banknote },
  { key: 'bank', icon: Landmark },
  { key: 'phone', icon: Smartphone },
  { key: 'gift', icon: Gift },
  { key: 'cart', icon: ShoppingCart },
  { key: 'store', icon: Store },
  { key: 'briefcase', icon: Briefcase },
  { key: 'globe', icon: Globe },
];

const ICON_BY_KEY = new Map(PAYMENT_METHOD_ICON_OPTIONS.map((option) => [option.key, option.icon]));

const PRESET_BY_KEY = new Map(PAYMENT_METHOD_PRESETS.map((preset) => [preset.key, preset]));

const FALLBACK_PRESET: PaymentMethodPreset = {
  key: 'custom',
  label: 'Custom',
  color: '#475569',
  icon: Wallet,
};

export function getPaymentMethodPreset(
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
