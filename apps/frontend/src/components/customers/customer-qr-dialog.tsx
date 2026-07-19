'use client';

import { QRCodeSVG } from 'qrcode.react';
import { useTranslations } from 'next-intl';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

export function CustomerQrDialog({
  trigger,
  customerName,
  publicUrl,
}: {
  trigger: React.ReactElement;
  customerName: string;
  publicUrl: string;
}) {
  const t = useTranslations('customers.detail');

  return (
    <Dialog>
      <DialogTrigger render={trigger} />
      <DialogContent className="sm:max-w-xs">
        <DialogHeader>
          <DialogTitle>{t('qrDialogTitle')}</DialogTitle>
          <DialogDescription>{t('qrDialogDescription', { name: customerName })}</DialogDescription>
        </DialogHeader>
        <div className="flex justify-center rounded-xl border border-border bg-white p-5">
          <QRCodeSVG value={publicUrl} size={200} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
