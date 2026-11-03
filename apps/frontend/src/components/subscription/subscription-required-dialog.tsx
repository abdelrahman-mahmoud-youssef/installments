'use client';

import { LifeBuoy, Lock, LogOut } from 'lucide-react';
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
import { useLogout } from '@/hooks/use-logout';
import { Link } from '@/i18n/navigation';
import { CurrentUserSubscription } from '@/lib/api/auth';
import { formatMoney } from '@/lib/format';
import { routes } from '@/lib/routes';
import { PaymentInstructions } from './payment-instructions';

export function SubscriptionRequiredDialog({
  subscription,
  isShopAdmin,
}: {
  subscription: CurrentUserSubscription;
  isShopAdmin: boolean;
}) {
  const t = useTranslations('subscription');
  const tNav = useTranslations('nav');
  const locale = useLocale();
  const handleLogout = useLogout();
  const price = formatMoney(subscription.monthlyPrice, locale);

  return (
    <Dialog open disablePointerDismissal onOpenChange={() => undefined}>
      <DialogContent showCloseButton={false} className="sm:max-w-md">
        <DialogHeader>
          <span className="grid size-11 place-items-center rounded-full bg-warning-soft text-warning">
            <Lock className="size-5" />
          </span>
          <DialogTitle>{t('title')}</DialogTitle>
          <DialogDescription>
            {isShopAdmin ? t('adminDescription', { price }) : t('staffDescription')}
          </DialogDescription>
        </DialogHeader>
        {isShopAdmin && <PaymentInstructions subscription={subscription} />}
        <DialogFooter>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="size-4" />
            {tNav('logout')}
          </Button>
          {isShopAdmin && (
            <Button render={<Link href={routes.support} />}>
              <LifeBuoy className="size-4" />
              {t('sendReceipt')}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
