import { WalletAccess } from '@/lib/enums';
import { CreateStaffInput, StaffWalletAccessInput } from '@/lib/schemas/staff';
import { apiClient } from './client';

export interface StaffMember {
  id: string;
  name: string;
  email: string;
  isActive: boolean;
  walletAccess: WalletAccess;
  paymentMethodIds: string[];
  createdAt: string;
}

export function listStaff(): Promise<StaffMember[]> {
  return apiClient.get('staff');
}

export function createStaff(input: CreateStaffInput): Promise<StaffMember> {
  return apiClient.post('staff', input);
}

export function setStaffActive(id: string, isActive: boolean): Promise<StaffMember> {
  return apiClient.patch(`staff/${id}`, { isActive });
}

export function updateStaffWalletAccess(id: string, input: StaffWalletAccessInput): Promise<StaffMember> {
  return apiClient.patch(`staff/${id}/wallet-access`, {
    walletAccess: input.walletAccess,
    paymentMethodIds: input.walletAccess === 'SELECTED' ? input.paymentMethodIds : undefined,
  });
}
