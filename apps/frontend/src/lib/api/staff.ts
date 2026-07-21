import { CreateStaffInput } from '@/lib/schemas/staff';
import { apiClient } from './client';

export interface StaffMember {
  id: string;
  email: string;
  isActive: boolean;
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
