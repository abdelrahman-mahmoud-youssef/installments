'use client';

import { CalendarClock } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useCurrentUser } from '@/hooks/use-current-user';
import { CurrentUserSubscription } from '@/lib/api/auth';
import { SubscriptionRenewalDialog } from './subscription-renewal-dialog';

function renewalMessageKey(subscription: CurrentUserSubscription, isShopAdmin: boolean) {
  if (!isShopAdmin) {
    return 'renewalStaff';
  }
  return subscription.status === 'TRIAL' ? 'renewalTrialAdmin' : 'renewalPaidAdmin';
}

export function SubscriptionRenewalBanner() {
  const t = useTranslations('subscription');
  const { data: currentUser } = useCurrentUser();
  const [dialogOpen, setDialogOpen] = useState(false);

  if (!currentUser?.subscription.isRenewalDueSoon) {
    return null;
  }

  const { subscription } = currentUser;
  const isShopAdmin = currentUser.role === 'ADMIN';

  return (
    <div
      role="status"
      className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-warning/30 bg-warning-soft px-4 py-2 text-sm sm:px-6"
    >
      <CalendarClock className="size-4 shrink-0 text-warning" />
      <span className="min-w-0 flex-1 text-foreground">
        {t(renewalMessageKey(subscription, isShopAdmin), { days: subscription.daysRemaining })}
      </span>
      {isShopAdmin && (
        <>
          <Button type="button" size="sm" onClick={() => setDialogOpen(true)}>
            {t('renewNow')}
          </Button>
          <SubscriptionRenewalDialog subscription={subscription} open={dialogOpen} onOpenChange={setDialogOpen} />
        </>
      )}
    </div>
  );
}
