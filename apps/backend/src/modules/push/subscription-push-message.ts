import { NotificationLanguage } from '@prisma/client';
import { SUBSCRIPTION_PUSH_DAYS_BEFORE_EXPIRY } from '../../common/constants';
import { PushContent } from './push.types';
import { SubscriptionPushKind } from './subscription-push-schedule';

const EXPIRING_DAYS_PLACEHOLDER = '{days}';

const SUBSCRIPTION_PUSH_COPY: Record<SubscriptionPushKind, Record<NotificationLanguage, PushContent>> = {
  SUBSCRIPTION_EXPIRING: {
    [NotificationLanguage.EN]: {
      title: 'Subscription ending soon',
      body: `Your subscription ends in ${EXPIRING_DAYS_PLACEHOLDER} days. Open Support to renew.`,
    },
    [NotificationLanguage.AR]: {
      title: 'اشتراكك على وشك الانتهاء',
      body: `ينتهي اشتراكك بعد ${EXPIRING_DAYS_PLACEHOLDER} أيام. افتح الدعم للتجديد.`,
    },
  },
  SUBSCRIPTION_EXPIRED: {
    [NotificationLanguage.EN]: {
      title: 'Subscription ended',
      body: 'Your subscription has ended and your shop is read-only. Open Support to renew.',
    },
    [NotificationLanguage.AR]: {
      title: 'انتهى الاشتراك',
      body: 'انتهى اشتراكك والمتجر الآن للقراءة فقط. افتح الدعم للتجديد.',
    },
  },
};

export function buildSubscriptionPushContent(kind: SubscriptionPushKind, language: NotificationLanguage): PushContent {
  const content = SUBSCRIPTION_PUSH_COPY[kind][language];
  return {
    title: content.title,
    body: content.body.replace(EXPIRING_DAYS_PLACEHOLDER, String(SUBSCRIPTION_PUSH_DAYS_BEFORE_EXPIRY)),
  };
}
