import { BrandColorPreset } from '@/lib/schemas/branding';

export const BRAND_COLOR_VALUES: Record<BrandColorPreset, string> = {
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

export function brandColorCssVars(preset: BrandColorPreset): string {
  const color = BRAND_COLOR_VALUES[preset];
  return `--primary:${color};--primary-foreground:#ffffff;--ring:${color};--shadow-brand:0 6px 20px -6px ${color}66;`;
}
