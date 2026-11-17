import { useCurrentUser } from './use-current-user';

export function useWalletAccess() {
  const { data: currentUser, isLoading } = useCurrentUser();
  const walletAccess = currentUser?.walletAccess;

  return {
    isLoading,
    canViewWallets: walletAccess === 'ALL' || walletAccess === 'SELECTED',
    canManageWallets: currentUser?.role === 'ADMIN',
  };
}
