import { useMutation, useQueryClient } from '@tanstack/react-query';
import { disableTwoFactor, enableTwoFactor, setupTwoFactor } from '@/lib/api/two-factor';
import { currentUserKeys } from './use-current-user';

export function useSetupTwoFactor() {
  return useMutation({ mutationFn: setupTwoFactor });
}

export function useEnableTwoFactor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (code: string) => enableTwoFactor(code),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: currentUserKeys.all }),
  });
}

export function useDisableTwoFactor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (code: string) => disableTwoFactor(code),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: currentUserKeys.all }),
  });
}
