'use client';

import { Download } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { InstallAppButton } from '@/components/shared/install-app-button';
import { IosInstallHint } from '@/components/shared/ios-install-hint';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

export function InstallAppDialog() {
  const t = useTranslations('settings');

  return (
    <Dialog>
      <DialogTrigger
        render={
          <Button variant="outline" size="sm">
            <Download className="size-4" />
            {t('tabInstallApp')}
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('installAppTitle')}</DialogTitle>
          <DialogDescription>{t('installAppDescription')}</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <InstallAppButton label={t('installAppButton')} className="w-fit" />
          <IosInstallHint
            storageKey="pwa-ios-hint-dashboard"
            message={t('installAppIosHint')}
            dismissLabel={t('dismiss')}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
