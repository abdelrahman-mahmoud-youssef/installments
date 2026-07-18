import { config } from '@/lib/config';

export interface PublicUpcomingInstallment {
  dueDate: string;
  remainingAmount: number;
}

export interface PublicContractSummary {
  productName: string;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  paidInstallmentsCount: number;
  upcomingInstallments: PublicUpcomingInstallment[];
}

export interface PublicCustomerResponse {
  name: string;
  contracts: PublicContractSummary[];
}

export async function getPublicCustomer(publicId: string): Promise<PublicCustomerResponse | null> {
  const response = await fetch(`${config.backendUrl}/public/customers/${publicId}`, { cache: 'no-store' });

  if (response.status === 404) {
    return null;
  }
  if (!response.ok) {
    throw new Error('Failed to load customer.');
  }
  return response.json() as Promise<PublicCustomerResponse>;
}
