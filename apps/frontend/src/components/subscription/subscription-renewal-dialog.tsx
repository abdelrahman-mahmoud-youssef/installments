'use client';

import { CalendarClock, LifeBuoy } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Link } from '@/i18n/navigation';
import { CurrentUserSubscription } from '@/lib/api/auth';
import { formatDate, formatMoney } from '@/lib/format';
import { routes } from '@/lib/routes';
import { PaymentInstructions } from './payment-instructions';

export function SubscriptionRenewalDialog({
  subscription,
  open,
  onOpenChange,
}: {
  subscription: CurrentUserSubscription;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useTranslations('subscription');
  const locale = useLocale();
  const price = formatMoney(subscription.monthlyPrice, locale);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <span className="grid size-11 place-items-center rounded-full bg-warning-soft text-warning">
            <CalendarClock className="size-5" />
          </span>
          <DialogTitle>{t('renewalDialogTitle')}</DialogTitle>
          <DialogDescription>
            {t('renewalDialogDescription', { price, date: formatDate(subscription.expiresOn) })}
          </DialogDescription>
        </DialogHeader>
        <PaymentInstructions subscription={subscription} />
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('later')}
          </Button>
          <Button render={<Link href={routes.support} onClick={() => onOpenChange(false)} />}>
            <LifeBuoy className="size-4" />
            {t('sendReceipt')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
