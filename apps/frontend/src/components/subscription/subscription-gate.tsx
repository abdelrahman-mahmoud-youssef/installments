'use client';

import { useCurrentUser } from '@/hooks/use-current-user';
import { usePathname } from '@/i18n/navigation';
import { routes } from '@/lib/routes';
import { SubscriptionRequiredDialog } from './subscription-required-dialog';

export function SubscriptionGate() {
  const pathname = usePathname();
  const { data: currentUser } = useCurrentUser();

  const isExpired = currentUser?.subscription.status === 'EXPIRED';
  const isOnSupportPage = pathname === routes.support || pathname.startsWith(`${routes.support}/`);
  if (!currentUser || !isExpired || isOnSupportPage) {
    return null;
  }

  return (
    <SubscriptionRequiredDialog subscription={currentUser.subscription} isShopAdmin={currentUser.role === 'ADMIN'} />
  );
}
