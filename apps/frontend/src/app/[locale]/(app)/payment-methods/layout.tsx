'use client';

import { useEffect } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { useWalletAccess } from '@/hooks/use-wallet-access';
import { useRouter } from '@/i18n/navigation';
import { routes } from '@/lib/routes';

export default function PaymentMethodsLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isLoading, canViewWallets } = useWalletAccess();
  const isDenied = !isLoading && !canViewWallets;

  useEffect(() => {
    if (isDenied) {
      router.replace(routes.dashboard);
    }
  }, [isDenied, router]);

  if (!canViewWallets) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-9 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  return children;
}
