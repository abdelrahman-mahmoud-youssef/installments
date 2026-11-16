import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { PushLanguage, registerPushDevice, unregisterPushDevice } from '@/api/push';
import { Locale } from '@/i18n/translations';

const ANDROID_CHANNEL_ID = 'default';

const PUSH_LANGUAGE_BY_LOCALE: Record<Locale, PushLanguage> = { ar: 'AR', en: 'EN' };

let registeredToken: string | null = null;

async function ensurePermission(): Promise<boolean> {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) {
    return true;
  }
  if (!current.canAskAgain) {
    return false;
  }
  const requested = await Notifications.requestPermissionsAsync();
  return requested.granted;
}

async function ensureAndroidChannel(): Promise<void> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(ANDROID_CHANNEL_ID, {
      name: ANDROID_CHANNEL_ID,
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }
}

export async function registerForPush(locale: Locale): Promise<void> {
  const projectId = Constants.expoConfig?.extra?.eas?.projectId as string | undefined;
  if (!Device.isDevice || !projectId) {
    return;
  }
  try {
    await ensureAndroidChannel();
    if (!(await ensurePermission())) {
      return;
    }
    const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });
    await registerPushDevice(token, PUSH_LANGUAGE_BY_LOCALE[locale]);
    registeredToken = token;
  } catch (error) {
    console.warn('Could not register this device for push notifications', error);
  }
}

export function forgetPushRegistration(): void {
  registeredToken = null;
}

export async function unregisterFromPush(): Promise<void> {
  const token = registeredToken;
  registeredToken = null;
  if (!token) {
    return;
  }
  try {
    await unregisterPushDevice(token);
  } catch (error) {
    console.warn('Could not unregister this device from push notifications', error);
  }
}
