import { apiClient, buildQuery, PaginatedResult } from './client';

export interface AuditLogEntry {
  id: string;
  userName: string;
  userEmail: string;
  action: string;
  entityType: string;
  entityId: string | null;
  createdAt: string;
}

export interface AuditLogParams {
  page?: number;
  limit?: number;
}

export function listAuditLogs(params: AuditLogParams): Promise<PaginatedResult<AuditLogEntry>> {
  return apiClient.get(`audit-logs${buildQuery({ ...params })}`);
}
