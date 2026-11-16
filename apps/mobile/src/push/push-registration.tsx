import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import { useAuth } from '@/auth/auth-context';
import { useI18n } from '@/i18n/i18n-context';
import { registerForPush } from './push-device';
import { resolvePushRoute } from './push-route';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export function PushRegistration() {
  const { isAuthenticated } = useAuth();
  const { locale } = useI18n();
  const router = useRouter();
  const lastResponse = Notifications.useLastNotificationResponse();
  const handledResponseId = useRef<string | null>(null);

  useEffect(() => {
    if (isAuthenticated) {
      void registerForPush(locale);
    }
  }, [isAuthenticated, locale]);

  useEffect(() => {
    if (!isAuthenticated || !lastResponse) {
      return;
    }
    const responseId = lastResponse.notification.request.identifier;
    if (handledResponseId.current === responseId) {
      return;
    }
    handledResponseId.current = responseId;
    const route = resolvePushRoute(lastResponse.notification.request.content.data);
    if (route) {
      router.push(route);
    }
  }, [isAuthenticated, lastResponse, router]);

  return null;
}
