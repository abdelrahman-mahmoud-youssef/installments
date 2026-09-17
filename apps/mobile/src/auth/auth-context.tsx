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
import { CurrentUser, getMe, login, verifyTwoFactor } from '@/api/auth';
import { setAuthToken, setUnauthorizedHandler } from '@/api/client';
import { tokenStorage } from '@/lib/storage';
import { useTheme } from '@/theme/theme-context';

export type SignInResult = { status: 'authenticated' } | { status: 'twoFactor'; challengeToken: string };

interface AuthContextValue {
  user: CurrentUser | null;
  isAuthenticated: boolean;
  isReady: boolean;
  isAdmin: boolean;
  signIn: (email: string, password: string) => Promise<SignInResult>;
  completeTwoFactor: (challengeToken: string, code: string) => Promise<void>;
  signOut: () => Promise<void>;
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
    queryClient.clear();
    await tokenStorage.clear();
  }, [queryClient]);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      void clearSession();
    });
    return () => setUnauthorizedHandler(null);
  }, [clearSession]);

  useEffect(() => {
    void tokenStorage
      .get()
      .then(async (token) => {
        if (!token) {
          return;
        }
        setAuthToken(token);
        const currentUser = await getMe();
        setUser(currentUser);
      })
      .catch(() => clearSession())
      .finally(() => setIsReady(true));
  }, [clearSession]);

  const adoptToken = useCallback(async (accessToken: string) => {
    setAuthToken(accessToken);
    await tokenStorage.set(accessToken);
    const currentUser = await getMe();
    setUser(currentUser);
  }, []);

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

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: user !== null,
      isReady,
      isAdmin: user?.role === 'ADMIN',
      signIn,
      completeTwoFactor,
      signOut: clearSession,
    }),
    [user, isReady, signIn, completeTwoFactor, clearSession],
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
