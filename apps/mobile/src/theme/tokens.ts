import { Platform } from 'react-native';

export interface ThemeColors {
  background: string;
  surface: string;
  surfaceMuted: string;
  border: string;
  text: string;
  textMuted: string;
  textFaint: string;
  primary: string;
  primaryMuted: string;
  onPrimary: string;
  danger: string;
  dangerMuted: string;
  success: string;
  successMuted: string;
  warning: string;
  warningMuted: string;
  info: string;
  infoMuted: string;
  overlay: string;
  skeleton: string;
  tabBar: string;
}

export const lightColors: ThemeColors = {
  background: '#f4f6f5',
  surface: '#ffffff',
  surfaceMuted: '#f0f2f1',
  border: '#e4e8e6',
  text: '#101614',
  textMuted: '#5c6662',
  textFaint: '#8b9490',
  primary: '#059669',
  primaryMuted: '#d7f2e7',
  onPrimary: '#ffffff',
  danger: '#dc2626',
  dangerMuted: '#fde8e8',
  success: '#059669',
  successMuted: '#d7f2e7',
  warning: '#b45309',
  warningMuted: '#fdeed5',
  info: '#2563eb',
  infoMuted: '#dfeafe',
  overlay: 'rgba(8, 12, 10, 0.5)',
  skeleton: '#e6eae8',
  tabBar: '#ffffff',
};

export const darkColors: ThemeColors = {
  background: '#0c1210',
  surface: '#161d1a',
  surfaceMuted: '#1e2622',
  border: '#28322d',
  text: '#eef2f0',
  textMuted: '#9aa5a0',
  textFaint: '#6d7873',
  primary: '#10b981',
  primaryMuted: '#123f31',
  onPrimary: '#04120c',
  danger: '#f87171',
  dangerMuted: '#3d1a1a',
  success: '#34d399',
  successMuted: '#123f31',
  warning: '#fbbf24',
  warningMuted: '#3b2c10',
  info: '#60a5fa',
  infoMuted: '#16283f',
  overlay: 'rgba(0, 0, 0, 0.65)',
  skeleton: '#212a26',
  tabBar: '#121815',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
  xxxl: 40,
} as const;

export const radius = {
  sm: 10,
  md: 14,
  lg: 20,
  xl: 28,
  full: 999,
} as const;

export const fontSizes = {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 17,
  xl: 20,
  xxl: 24,
  xxxl: 30,
} as const;

export type FontSizeToken = keyof typeof fontSizes;

export const fontFamilies = {
  monospace: Platform.select({ ios: 'Menlo', default: 'monospace' }),
} as const;

export const logicalTextAlign = {
  start: 'left',
  end: 'right',
} as const;

export const touchTarget = {
  minHeight: 44,
} as const;

export const floatingActionClearance = touchTarget.minHeight + spacing.xxl;
