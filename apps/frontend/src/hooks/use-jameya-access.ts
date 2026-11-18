import { useCurrentUser } from './use-current-user';

export function useJameyaAccess() {
  const { data: currentUser, isLoading } = useCurrentUser();

  return {
    isLoading,
    isJameyaEnabled: currentUser?.tenant.jameyaEnabled === true,
    canManageJameyas: currentUser?.role === 'ADMIN',
  };
}
