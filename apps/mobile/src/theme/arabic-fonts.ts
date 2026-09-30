import type { TextStyle } from 'react-native';

export type ArabicFontOption = 'system' | 'cairo' | 'tajawal' | 'almarai';

export const ARABIC_FONT_OPTIONS: ArabicFontOption[] = ['system', 'cairo', 'tajawal', 'almarai'];

export function isArabicFontOption(value: string): value is ArabicFontOption {
  return ARABIC_FONT_OPTIONS.some((option) => option === value);
}

export const ARABIC_FONT_ASSETS = {
  Cairo_400Regular: require('@expo-google-fonts/cairo/400Regular/Cairo_400Regular.ttf'),
  Cairo_500Medium: require('@expo-google-fonts/cairo/500Medium/Cairo_500Medium.ttf'),
  Cairo_600SemiBold: require('@expo-google-fonts/cairo/600SemiBold/Cairo_600SemiBold.ttf'),
  Cairo_700Bold: require('@expo-google-fonts/cairo/700Bold/Cairo_700Bold.ttf'),
  Tajawal_400Regular: require('@expo-google-fonts/tajawal/400Regular/Tajawal_400Regular.ttf'),
  Tajawal_500Medium: require('@expo-google-fonts/tajawal/500Medium/Tajawal_500Medium.ttf'),
  Tajawal_700Bold: require('@expo-google-fonts/tajawal/700Bold/Tajawal_700Bold.ttf'),
  Almarai_400Regular: require('@expo-google-fonts/almarai/400Regular/Almarai_400Regular.ttf'),
  Almarai_700Bold: require('@expo-google-fonts/almarai/700Bold/Almarai_700Bold.ttf'),
};

const FAMILY_BY_WEIGHT: Record<Exclude<ArabicFontOption, 'system'>, Record<string, string>> = {
  cairo: {
    '400': 'Cairo_400Regular',
    '500': 'Cairo_500Medium',
    '600': 'Cairo_600SemiBold',
    '700': 'Cairo_700Bold',
  },
  tajawal: {
    '400': 'Tajawal_400Regular',
    '500': 'Tajawal_500Medium',
    '600': 'Tajawal_700Bold',
    '700': 'Tajawal_700Bold',
  },
  almarai: {
    '400': 'Almarai_400Regular',
    '500': 'Almarai_400Regular',
    '600': 'Almarai_700Bold',
    '700': 'Almarai_700Bold',
  },
};

export function resolveArabicFontFamily(
  option: ArabicFontOption,
  weight: TextStyle['fontWeight'],
): string | undefined {
  if (option === 'system') {
    return undefined;
  }
  const families = FAMILY_BY_WEIGHT[option];
  return families[String(weight ?? '400')] ?? families['400'];
}
