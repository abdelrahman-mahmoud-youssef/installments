import { useQueryClient } from '@tanstack/react-query';
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { AppState } from 'react-native';
import {
  CurrentUser,
  DeleteAccountInput,
  deleteAccount as requestAccountDeletion,
  getMe,
  login,
  register,
  RegisterInput,
  verifyTwoFactor,
} from '@/api/auth';
import {
  NetworkError,
  setAuthToken,
  setSubscriptionInactiveHandler,
  setUnauthorizedHandler,
} from '@/api/client';
import { restoreQueryCache, startQueryCachePersistence, stopQueryCachePersistence } from '@/lib/query-persistence';
import { preferenceStorage, tokenStorage } from '@/lib/storage';
import { forgetPushRegistration, unregisterFromPush } from '@/push/push-device';
import { useTheme } from '@/theme/theme-context';
import { userSnapshotStorage } from './user-snapshot-storage';

function cacheOwnerKey(user: CurrentUser): string {
  return `${user.tenantId}:${user.id}`;
}

export type SignInResult = { status: 'authenticated' } | { status: 'twoFactor'; challengeToken: string };

interface AuthContextValue {
  user: CurrentUser | null;
  isAuthenticated: boolean;
  isReady: boolean;
  isAdmin: boolean;
  canSeeWallets: boolean;
  canUseJameyas: boolean;
  isSubscriptionExpired: boolean;
  signIn: (email: string, password: string) => Promise<SignInResult>;
  register: (input: RegisterInput) => Promise<void>;
  completeTwoFactor: (challengeToken: string, code: string) => Promise<void>;
  signOut: () => Promise<void>;
  deleteAccount: (input: DeleteAccountInput) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [isReady, setIsReady] = useState(false);
  const queryClient = useQueryClient();
  const { setBrandColor } = useTheme();

  useEffect(() => {
    if (isReady) {
      setBrandColor(user?.tenant.brandColor ?? null);
    }
  }, [user, isReady, setBrandColor]);

  const clearSession = useCallback(async () => {
    setAuthToken(null);
    setUser(null);
    await stopQueryCachePersistence();
    queryClient.clear();
    await Promise.all([tokenStorage.clear(), userSnapshotStorage.clear()]);
  }, [queryClient]);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      void clearSession();
    });
    return () => setUnauthorizedHandler(null);
  }, [clearSession]);

  useEffect(() => {
    async function restoreSession(): Promise<void> {
      const token = await tokenStorage.get();
      if (!token) {
        return;
      }
      setAuthToken(token);
      const snapshot = await userSnapshotStorage.get();
      if (snapshot && snapshot.subscription.status !== 'EXPIRED') {
        await restoreQueryCache(cacheOwnerKey(snapshot));
        setUser(snapshot);
        getMe()
          .then(setUser)
          .catch((error: unknown) => {
            if (!(error instanceof NetworkError)) {
              console.warn('Could not refresh the signed-in user', error);
            }
          });
        return;
      }
      const currentUser = await getMe();
      await restoreQueryCache(cacheOwnerKey(currentUser));
      setUser(currentUser);
    }

    restoreSession()
      .catch((error: unknown) => (error instanceof NetworkError ? undefined : clearSession()))
      .finally(() => setIsReady(true));
  }, [clearSession]);

  useEffect(() => {
    if (isReady && user) {
      void userSnapshotStorage.set(user);
    }
  }, [user, isReady]);

  const cacheOwner = user ? cacheOwnerKey(user) : null;
  useEffect(() => {
    if (isReady && cacheOwner) {
      startQueryCachePersistence(cacheOwner);
    }
  }, [isReady, cacheOwner]);

  const adoptToken = useCallback(async (accessToken: string) => {
    setAuthToken(accessToken);
    await tokenStorage.set(accessToken);
    const currentUser = await getMe();
    setUser(currentUser);
  }, []);

  const refreshUser = useCallback(async () => {
    setUser(await getMe());
  }, []);

  useEffect(() => {
    setSubscriptionInactiveHandler(() => {
      void refreshUser();
    });
    return () => setSubscriptionInactiveHandler(null);
  }, [refreshUser]);

  const isSignedIn = user !== null;
  useEffect(() => {
    if (!isSignedIn) {
      return;
    }
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        refreshUser().catch(() => undefined);
      }
    });
    return () => subscription.remove();
  }, [isSignedIn, refreshUser]);

  const signIn = useCallback(
    async (email: string, password: string): Promise<SignInResult> => {
      const result = await login(email, password);
      if ('requiresTwoFactor' in result) {
        return { status: 'twoFactor', challengeToken: result.challengeToken };
      }
      await adoptToken(result.accessToken);
      return { status: 'authenticated' };
    },
    [adoptToken],
  );

  const completeTwoFactor = useCallback(
    async (challengeToken: string, code: string) => {
      const result = await verifyTwoFactor(challengeToken, code);
      await adoptToken(result.accessToken);
    },
    [adoptToken],
  );

  const signOut = useCallback(async () => {
    await unregisterFromPush();
    await clearSession();
  }, [clearSession]);

  const deleteAccount = useCallback(
    async (input: DeleteAccountInput) => {
      await requestAccountDeletion(input);
      forgetPushRegistration();
      await preferenceStorage.clear();
      await clearSession();
    },
    [clearSession],
  );

  const registerAccount = useCallback(
    async (input: RegisterInput) => {
      const result = await register(input);
      await adoptToken(result.accessToken);
    },
    [adoptToken],
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: user !== null,
      isReady,
      isAdmin: user?.role === 'ADMIN',
      canSeeWallets: user?.walletAccess === 'ALL' || user?.walletAccess === 'SELECTED',
      canUseJameyas: user?.tenant.jameyaEnabled === true,
      isSubscriptionExpired: user?.subscription.status === 'EXPIRED',
      signIn,
      register: registerAccount,
      completeTwoFactor,
      signOut,
      deleteAccount,
      refreshUser,
    }),
    [user, isReady, signIn, registerAccount, completeTwoFactor, signOut, deleteAccount, refreshUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
