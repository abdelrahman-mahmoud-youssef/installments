import { apiClient } from './client';
import { buildQuery, PaginatedResult } from './pagination';

export interface AuditLogEntry {
  id: string;
  userName: string;
  userEmail: string;
  action: string;
  entityType: string;
  entityId: string | null;
  createdAt: string;
}

export interface AuditLogQueryParams {
  page?: number;
  limit?: number;
}

export function listAuditLogs(params: AuditLogQueryParams): Promise<PaginatedResult<AuditLogEntry>> {
  return apiClient.get(`audit-logs${buildQuery(params)}`);
}
