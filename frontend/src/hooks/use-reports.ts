import { useQuery } from '@tanstack/react-query';
import { getReports } from '@/lib/api/reports';

export const reportsKeys = {
  all: ['reports'] as const,
  month: (month?: string) => [...reportsKeys.all, month] as const,
};

export function useReports(month?: string) {
  return useQuery({
    queryKey: reportsKeys.month(month),
    queryFn: () => getReports(month),
  });
}
