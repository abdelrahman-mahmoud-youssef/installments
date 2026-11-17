import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createStaff, listStaff, setStaffActive, StaffMember, updateStaffWalletAccess } from '@/lib/api/staff';
import { CreateStaffInput, StaffWalletAccessInput } from '@/lib/schemas/staff';

export const staffKeys = {
  all: ['staff'] as const,
};

export function useStaff() {
  return useQuery({ queryKey: staffKeys.all, queryFn: listStaff });
}

export function useCreateStaff() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateStaffInput) => createStaff(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: staffKeys.all }),
  });
}

export function useSetStaffActive() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) => setStaffActive(id, isActive),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: staffKeys.all }),
  });
}

export function useUpdateStaffWalletAccess() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: StaffWalletAccessInput }) => updateStaffWalletAccess(id, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: staffKeys.all }),
  });
}

export type { StaffMember };
