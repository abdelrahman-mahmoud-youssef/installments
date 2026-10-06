import { getLocales } from 'expo-localization';
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { I18nManager } from 'react-native';
import { preferenceKeys, preferenceStorage } from '@/lib/storage';
import { Locale, translations } from './translations';

type TranslateParams = Record<string, string | number>;

export type LayoutDirection = 'ltr' | 'rtl';

interface I18nContextValue {
  locale: Locale;
  isRTL: boolean;
  direction: LayoutDirection;
  setLocale: (locale: Locale) => void;
  t: (key: string, params?: TranslateParams) => string;
  isReady: boolean;
}

const I18nContext = createContext<I18nContextValue | null>(null);

function deviceLocale(): Locale {
  return getLocales()[0]?.languageCode === 'ar' ? 'ar' : 'en';
}

function resolveKey(locale: Locale, key: string): string {
  let node: unknown = translations[locale];
  for (const segment of key.split('.')) {
    if (typeof node !== 'object' || node === null) {
      return key;
    }
    node = (node as Record<string, unknown>)[segment];
  }
  return typeof node === 'string' ? node : key;
}

function interpolate(template: string, params?: TranslateParams): string {
  if (!params) {
    return template;
  }
  return template.replace(/\{(\w+)\}/g, (match, name: string) =>
    params[name] !== undefined ? String(params[name]) : match,
  );
}

function disableNativeLayoutMirroring(): void {
  I18nManager.allowRTL(false);
  I18nManager.forceRTL(false);
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('en');
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    disableNativeLayoutMirroring();
    void preferenceStorage.get(preferenceKeys.locale).then((stored) => {
      setLocaleState(stored === 'ar' || stored === 'en' ? stored : deviceLocale());
      setIsReady(true);
    });
  }, []);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    void preferenceStorage.set(preferenceKeys.locale, next);
  }, []);

  const value = useMemo<I18nContextValue>(() => {
    const isRTL = locale === 'ar';
    return {
      locale,
      isRTL,
      direction: isRTL ? 'rtl' : 'ltr',
      setLocale,
      t: (key, params) => interpolate(resolveKey(locale, key), params),
      isReady,
    };
  }, [locale, setLocale, isReady]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within I18nProvider');
  }
  return context;
}
