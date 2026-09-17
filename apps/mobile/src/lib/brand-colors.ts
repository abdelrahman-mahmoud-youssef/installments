export const BRAND_COLOR_PRESETS = [
  'emerald',
  'teal',
  'blue',
  'indigo',
  'violet',
  'rose',
  'amber',
  'yellow',
  'slate',
] as const;

export type BrandColorPreset = (typeof BRAND_COLOR_PRESETS)[number];

export const BRAND_COLOR_HEX: Record<BrandColorPreset, string> = {
  emerald: '#047857',
  teal: '#0f766e',
  blue: '#2563eb',
  indigo: '#4f46e5',
  violet: '#7c3aed',
  rose: '#be123c',
  amber: '#b45309',
  yellow: '#f2ae03',
  slate: '#475569',
};

export function isBrandColorPreset(value: string): value is BrandColorPreset {
  return (BRAND_COLOR_PRESETS as readonly string[]).includes(value);
}
