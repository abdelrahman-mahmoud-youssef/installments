import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

const AUTH_TOKEN_KEY = 'qistak.auth-token';

export const tokenStorage = {
  get: (): Promise<string | null> => SecureStore.getItemAsync(AUTH_TOKEN_KEY),
  set: (token: string): Promise<void> => SecureStore.setItemAsync(AUTH_TOKEN_KEY, token),
  clear: (): Promise<void> => SecureStore.deleteItemAsync(AUTH_TOKEN_KEY),
};

export const preferenceStorage = {
  get: (key: string): Promise<string | null> => AsyncStorage.getItem(key),
  set: (key: string, value: string): Promise<void> => AsyncStorage.setItem(key, value),
};

export const preferenceKeys = {
  locale: 'qistak.locale',
  themeMode: 'qistak.theme-mode',
  fontScale: 'qistak.font-scale',
  brandColor: 'qistak.brand-color',
  arabicFont: 'qistak.arabic-font',
} as const;
