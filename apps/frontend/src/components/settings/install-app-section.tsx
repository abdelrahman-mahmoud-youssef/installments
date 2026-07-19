'use client';

import { useTranslations } from 'next-intl';
import { InstallAppButton } from '@/components/shared/install-app-button';
import { IosInstallHint } from '@/components/shared/ios-install-hint';
import { Section } from '@/components/shared/section';

export function InstallAppSection() {
  const t = useTranslations('settings');

  return (
    <Section title={t('installAppTitle')} description={t('installAppDescription')}>
      <div className="flex max-w-sm flex-col gap-3">
        <InstallAppButton label={t('installAppButton')} className="w-fit" />
        <IosInstallHint
          storageKey="pwa-ios-hint-dashboard"
          message={t('installAppIosHint')}
          dismissLabel={t('dismiss')}
        />
      </div>
    </Section>
  );
}
