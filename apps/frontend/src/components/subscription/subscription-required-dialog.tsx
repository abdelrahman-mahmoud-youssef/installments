'use client';

import { Copy, LifeBuoy, Lock, LogOut } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { toast } from 'sonner';
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

function PaymentInstructions({ subscription }: { subscription: CurrentUserSubscription }) {
  const t = useTranslations('subscription');
  const locale = useLocale();
  const price = formatMoney(subscription.monthlyPrice, locale);

  function handleCopyAddress() {
    void navigator.clipboard.writeText(subscription.paymentAddress);
    toast.success(t('addressCopied'));
  }

  return (
    <div className="space-y-3 rounded-lg border border-border bg-muted/40 p-3">
      <p className="text-sm font-medium">{t('howToPay')}</p>
      <ol className="list-decimal space-y-1.5 ps-5 text-sm text-muted-foreground">
        <li>{t('stepTransfer', { price })}</li>
        <li>{t('stepSendReceipt')}</li>
        <li>{t('stepActivation')}</li>
      </ol>
      <div className="flex items-center justify-between gap-3 rounded-md bg-background px-3 py-2 ring-1 ring-border">
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">{t('instapayAddress')}</p>
          <p dir="ltr" className="truncate text-start font-mono text-sm font-medium">
            {subscription.paymentAddress}
          </p>
        </div>
        <Button variant="ghost" size="icon-sm" onClick={handleCopyAddress} aria-label={t('copyAddress')}>
          <Copy className="size-4" />
        </Button>
      </div>
    </div>
  );
}

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
