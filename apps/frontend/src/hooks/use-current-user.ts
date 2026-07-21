import { useMutation, useQuery } from '@tanstack/react-query';
import { changePassword, ChangePasswordPayload, CurrentUser, getMe } from '@/lib/api/auth';

export const currentUserKeys = {
  all: ['auth', 'me'] as const,
};

export function useCurrentUser() {
  return useQuery({ queryKey: currentUserKeys.all, queryFn: getMe });
}

export function useChangePassword() {
  return useMutation({ mutationFn: (payload: ChangePasswordPayload) => changePassword(payload) });
}

export type { CurrentUser };
