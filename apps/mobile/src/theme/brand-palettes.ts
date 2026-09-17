import { BrandColorPreset } from '@/lib/brand-colors';

export interface BrandPalette {
  primary: string;
  primaryMuted: string;
  onPrimary: string;
}

interface BrandPaletteSet {
  light: BrandPalette;
  dark: BrandPalette;
}

export const BRAND_PALETTES: Record<BrandColorPreset, BrandPaletteSet> = {
  emerald: {
    light: { primary: '#059669', primaryMuted: '#d7f2e7', onPrimary: '#ffffff' },
    dark: { primary: '#10b981', primaryMuted: '#123f31', onPrimary: '#04120c' },
  },
  teal: {
    light: { primary: '#0d9488', primaryMuted: '#ccf3ee', onPrimary: '#ffffff' },
    dark: { primary: '#2dd4bf', primaryMuted: '#113b36', onPrimary: '#041412' },
  },
  blue: {
    light: { primary: '#2563eb', primaryMuted: '#dbe7fe', onPrimary: '#ffffff' },
    dark: { primary: '#60a5fa', primaryMuted: '#172a4a', onPrimary: '#06101f' },
  },
  indigo: {
    light: { primary: '#4f46e5', primaryMuted: '#e0e1fd', onPrimary: '#ffffff' },
    dark: { primary: '#818cf8', primaryMuted: '#1e2050', onPrimary: '#0a0b24' },
  },
  violet: {
    light: { primary: '#7c3aed', primaryMuted: '#ebe2fe', onPrimary: '#ffffff' },
    dark: { primary: '#a78bfa', primaryMuted: '#2a1d4d', onPrimary: '#120a26' },
  },
  rose: {
    light: { primary: '#be123c', primaryMuted: '#fde2e8', onPrimary: '#ffffff' },
    dark: { primary: '#fb7185', primaryMuted: '#4a1622', onPrimary: '#22070d' },
  },
  amber: {
    light: { primary: '#b45309', primaryMuted: '#fdeed5', onPrimary: '#ffffff' },
    dark: { primary: '#fbbf24', primaryMuted: '#3b2c10', onPrimary: '#1f1504' },
  },
  yellow: {
    light: { primary: '#ca8a04', primaryMuted: '#fdf3c7', onPrimary: '#ffffff' },
    dark: { primary: '#facc15', primaryMuted: '#3d3308', onPrimary: '#1c1703' },
  },
  slate: {
    light: { primary: '#475569', primaryMuted: '#e2e8f0', onPrimary: '#ffffff' },
    dark: { primary: '#94a3b8', primaryMuted: '#26303f', onPrimary: '#0b1220' },
  },
};
