import { apiClient } from './client';

export interface DashboardInstallmentSummary {
  id: string;
  contractId: string;
  customerId: string;
  customerName: string;
  productName: string;
  sequence: number;
  dueDate: string;
  amount: number;
  paidAmount: number;
}

export interface DashboardPaymentSummary {
  id: string;
  contractId: string;
  customerName: string;
  amount: number;
  paidAt: string;
}

export interface DashboardResponse {
  dueToday: DashboardInstallmentSummary[];
  overdue: DashboardInstallmentSummary[];
  dueNext7Days: DashboardInstallmentSummary[];
  totalExpectedToday: number;
  recentPayments: DashboardPaymentSummary[];
  totalCustomers: number;
  activeContracts: number;
  overdueBalance: number;
  pendingPaymentClaims: number;
}

export function getDashboard(): Promise<DashboardResponse> {
  return apiClient.get('dashboard');
}
