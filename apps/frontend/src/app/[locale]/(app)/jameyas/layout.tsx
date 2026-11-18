'use client';

import { useEffect } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { useJameyaAccess } from '@/hooks/use-jameya-access';
import { useRouter } from '@/i18n/navigation';
import { routes } from '@/lib/routes';

export default function JameyasLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isLoading, isJameyaEnabled } = useJameyaAccess();
  const isDenied = !isLoading && !isJameyaEnabled;

  useEffect(() => {
    if (isDenied) {
      router.replace(routes.dashboard);
    }
  }, [isDenied, router]);

  if (!isJameyaEnabled) {
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
