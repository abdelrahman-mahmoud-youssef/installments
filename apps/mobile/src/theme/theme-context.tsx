import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useColorScheme } from 'react-native';
import { BrandColorPreset, isBrandColorPreset } from '@/lib/brand-colors';
import { preferenceKeys, preferenceStorage } from '@/lib/storage';
import { BRAND_PALETTES } from './brand-palettes';
import { darkColors, fontSizes, FontSizeToken, lightColors, ThemeColors } from './tokens';

export type ThemeMode = 'light' | 'dark' | 'system';
export type FontScaleOption = 'small' | 'default' | 'large' | 'extraLarge';

const FONT_SCALE_FACTORS: Record<FontScaleOption, number> = {
  small: 0.9,
  default: 1,
  large: 1.12,
  extraLarge: 1.25,
};

const THEME_MODES: ThemeMode[] = ['light', 'dark', 'system'];
const FONT_SCALE_OPTIONS: FontScaleOption[] = ['small', 'default', 'large', 'extraLarge'];

interface ThemeContextValue {
  colors: ThemeColors;
  isDark: boolean;
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  fontScaleOption: FontScaleOption;
  setFontScaleOption: (option: FontScaleOption) => void;
  fontSize: (token: FontSizeToken) => number;
  brandColor: BrandColorPreset | null;
  setBrandColor: (preset: string | null) => void;
  isReady: boolean;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function toBrandColorPreset(value: string | null): BrandColorPreset | null {
  return value && isBrandColorPreset(value) ? value : null;
}

function resolveColors(isDark: boolean, brandColor: BrandColorPreset | null): ThemeColors {
  const base = isDark ? darkColors : lightColors;
  if (!brandColor) {
    return base;
  }
  return { ...base, ...BRAND_PALETTES[brandColor][isDark ? 'dark' : 'light'] };
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemScheme = useColorScheme();
  const [mode, setModeState] = useState<ThemeMode>('system');
  const [fontScaleOption, setFontScaleState] = useState<FontScaleOption>('default');
  const [brandColor, setBrandColorState] = useState<BrandColorPreset | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    void Promise.all([
      preferenceStorage.get(preferenceKeys.themeMode),
      preferenceStorage.get(preferenceKeys.fontScale),
      preferenceStorage.get(preferenceKeys.brandColor),
    ]).then(([storedMode, storedScale, storedBrandColor]) => {
      if (storedMode && THEME_MODES.includes(storedMode as ThemeMode)) {
        setModeState(storedMode as ThemeMode);
      }
      if (storedScale && FONT_SCALE_OPTIONS.includes(storedScale as FontScaleOption)) {
        setFontScaleState(storedScale as FontScaleOption);
      }
      setBrandColorState(toBrandColorPreset(storedBrandColor));
      setIsReady(true);
    });
  }, []);

  const setMode = useCallback((nextMode: ThemeMode) => {
    setModeState(nextMode);
    void preferenceStorage.set(preferenceKeys.themeMode, nextMode);
  }, []);

  const setFontScaleOption = useCallback((option: FontScaleOption) => {
    setFontScaleState(option);
    void preferenceStorage.set(preferenceKeys.fontScale, option);
  }, []);

  const setBrandColor = useCallback((preset: string | null) => {
    const next = toBrandColorPreset(preset);
    setBrandColorState(next);
    void preferenceStorage.set(preferenceKeys.brandColor, next ?? '');
  }, []);

  const value = useMemo<ThemeContextValue>(() => {
    const isDark = mode === 'system' ? systemScheme === 'dark' : mode === 'dark';
    const factor = FONT_SCALE_FACTORS[fontScaleOption];
    return {
      colors: resolveColors(isDark, brandColor),
      isDark,
      mode,
      setMode,
      fontScaleOption,
      setFontScaleOption,
      fontSize: (token) => Math.round(fontSizes[token] * factor),
      brandColor,
      setBrandColor,
      isReady,
    };
  }, [mode, systemScheme, fontScaleOption, brandColor, setMode, setFontScaleOption, setBrandColor, isReady]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}
