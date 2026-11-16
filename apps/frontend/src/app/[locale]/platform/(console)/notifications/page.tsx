'use client';

import { useTranslations } from 'next-intl';
import { PushHistory } from '@/components/platform/push-history';
import { SendPushForm } from '@/components/platform/send-push-form';
import { FadeIn } from '@/components/shared/motion';
import { PageHeader } from '@/components/shared/page-header';

export default function PlatformNotificationsPage() {
  const t = useTranslations('platform.notifications');

  return (
    <div className="space-y-6">
      <FadeIn>
        <PageHeader title={t('title')} description={t('subtitle')} />
      </FadeIn>
      <FadeIn delay={0.05}>
        <SendPushForm />
      </FadeIn>
      <FadeIn delay={0.1}>
        <PushHistory />
      </FadeIn>
    </div>
  );
}
