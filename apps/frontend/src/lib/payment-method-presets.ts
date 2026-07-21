import { Banknote, Landmark, Smartphone, Wallet, type LucideIcon } from 'lucide-react';

export interface PaymentMethodPreset {
  key: string;
  label: string;
  color: string;
  icon: LucideIcon;
}

export const PAYMENT_METHOD_PRESETS: PaymentMethodPreset[] = [
  { key: 'vodafone_cash', label: 'Vodafone Cash', color: '#e60000', icon: Smartphone },
  { key: 'orange_cash', label: 'Orange Cash', color: '#ff7900', icon: Smartphone },
  { key: 'etisalat_cash', label: 'Etisalat Cash', color: '#00a651', icon: Smartphone },
  { key: 'we_pay', label: 'WE Pay', color: '#4b2e83', icon: Smartphone },
  { key: 'instapay', label: 'InstaPay', color: '#6c2eb5', icon: Wallet },
  { key: 'fawry', label: 'Fawry', color: '#00a99d', icon: Banknote },
  { key: 'bank_transfer', label: 'Bank transfer', color: '#475569', icon: Landmark },
];

const PRESET_BY_KEY = new Map(PAYMENT_METHOD_PRESETS.map((preset) => [preset.key, preset]));

const FALLBACK_PRESET: PaymentMethodPreset = {
  key: 'custom',
  label: 'Custom',
  color: '#475569',
  icon: Wallet,
};

export function getPaymentMethodPreset(presetKey: string | null): PaymentMethodPreset {
  if (!presetKey) {
    return FALLBACK_PRESET;
  }
  return PRESET_BY_KEY.get(presetKey) ?? FALLBACK_PRESET;
}
