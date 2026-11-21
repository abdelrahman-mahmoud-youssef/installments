'use client';

import { ReceiptText, Table2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { JameyaDetail } from '@/lib/api/jameyas';
import { JameyaMembersGrid } from './jameya-members-grid';
import { JameyaPaymentsHistory } from './jameya-payments-history';

export function JameyaMoreViews({ jameya }: { jameya: JameyaDetail }) {
  const t = useTranslations('jameyas.detail');
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Dialog>
        <DialogTrigger
          render={
            <Button variant="ghost" size="sm">
              <Table2 className="size-4" />
              {t('fullTable')}
            </Button>
          }
        />
        <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-[min(96vw,1200px)]">
          <DialogHeader>
            <DialogTitle>{t('fullTable')}</DialogTitle>
          </DialogHeader>
          <JameyaMembersGrid jameya={jameya} />
        </DialogContent>
      </Dialog>
      <Dialog>
        <DialogTrigger
          render={
            <Button variant="ghost" size="sm">
              <ReceiptText className="size-4" />
              {t('allPayments')}
            </Button>
          }
        />
        <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{t('allPayments')}</DialogTitle>
          </DialogHeader>
          <JameyaPaymentsHistory jameya={jameya} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
