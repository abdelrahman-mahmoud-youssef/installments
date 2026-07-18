import { apiClient } from './client';
import { buildQuery } from './pagination';

export interface OverdueCustomerSummary {
  customerId: string;
  customerName: string;
  customerPhone: string;
  overdueBalance: number;
  overdueInstallmentCount: number;
}

export interface ReportsResponse {
  todayCollections: number;
  monthlyCollections: number;
  overdueBalance: number;
  overdueCustomers: OverdueCustomerSummary[];
}

export function getReports(month?: string): Promise<ReportsResponse> {
  return apiClient.get(`reports${buildQuery({ month })}`);
}
