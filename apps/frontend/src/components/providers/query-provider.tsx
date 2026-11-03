'use client';

import { MutationCache, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { currentUserKeys } from '@/hooks/use-current-user';
import { isSubscriptionInactiveError } from '@/lib/api/client';

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => {
    const client: QueryClient = new QueryClient({
      defaultOptions: {
        queries: { staleTime: 30_000, retry: 1 },
      },
      mutationCache: new MutationCache({
        onError: (error) => {
          if (isSubscriptionInactiveError(error)) {
            void client.invalidateQueries({ queryKey: currentUserKeys.all });
          }
        },
      }),
    });
    return client;
  });

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
