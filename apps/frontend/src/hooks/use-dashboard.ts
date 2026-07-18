import { useQuery } from '@tanstack/react-query';
import { getDashboard } from '@/lib/api/dashboard';

export const dashboardKeys = {
  all: ['dashboard'] as const,
};

export function useDashboard() {
  return useQuery({
    queryKey: dashboardKeys.all,
    queryFn: getDashboard,
  });
}
