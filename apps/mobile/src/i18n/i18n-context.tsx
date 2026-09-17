import { getLocales } from 'expo-localization';
import * as Updates from 'expo-updates';
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { Alert, DevSettings, I18nManager } from 'react-native';
import { preferenceKeys, preferenceStorage } from '@/lib/storage';
import { Locale, translations } from './translations';

type TranslateParams = Record<string, string | number>;

interface I18nContextValue {
  locale: Locale;
  isRTL: boolean;
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

function reloadApp(): void {
  if (__DEV__) {
    DevSettings.reload();
    return;
  }
  void Updates.reloadAsync().catch(() => undefined);
}

function applyLayoutDirection(locale: Locale): void {
  const shouldBeRTL = locale === 'ar';
  if (I18nManager.isRTL !== shouldBeRTL) {
    I18nManager.allowRTL(shouldBeRTL);
    I18nManager.forceRTL(shouldBeRTL);
    reloadApp();
  }
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('en');
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    void preferenceStorage.get(preferenceKeys.locale).then((stored) => {
      const initial = stored === 'ar' || stored === 'en' ? stored : deviceLocale();
      setLocaleState(initial);
      setIsReady(true);
      applyLayoutDirection(initial);
    });
  }, []);

  const setLocale = useCallback(
    (next: Locale) => {
      void preferenceStorage.set(preferenceKeys.locale, next).then(() => {
        const needsRestart = I18nManager.isRTL !== (next === 'ar');
        setLocaleState(next);
        if (needsRestart) {
          Alert.alert(
            resolveKey(next, 'settings.restartTitle'),
            resolveKey(next, 'settings.restartMessage'),
            [{ text: resolveKey(next, 'common.confirm'), onPress: () => applyLayoutDirection(next) }],
          );
        }
      });
    },
    [],
  );

  const value = useMemo<I18nContextValue>(
    () => ({
      locale,
      isRTL: locale === 'ar',
      setLocale,
      t: (key, params) => interpolate(resolveKey(locale, key), params),
      isReady,
    }),
    [locale, setLocale, isReady],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within I18nProvider');
  }
  return context;
}
