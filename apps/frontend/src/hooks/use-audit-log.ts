import { useQuery } from '@tanstack/react-query';
import { AuditLogQueryParams, listAuditLogs } from '@/lib/api/audit';

export const auditLogKeys = {
  all: ['audit-logs'] as const,
  list: (params: AuditLogQueryParams) => [...auditLogKeys.all, 'list', params] as const,
};

export function useAuditLog(params: AuditLogQueryParams) {
  return useQuery({
    queryKey: auditLogKeys.list(params),
    queryFn: () => listAuditLogs(params),
    placeholderData: (previousData) => previousData,
  });
}
