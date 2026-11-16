import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { AppState } from 'react-native';
import { useAuth } from '@/auth/auth-context';
import { useI18n } from '@/i18n/i18n-context';
import { preferenceKeys, preferenceStorage } from '@/lib/storage';
import { shouldLockAfterBackground } from './app-lock-policy';
import { authenticateOwner, canAuthenticateOnDevice } from './biometric-auth';

const APP_LOCK_DISABLED_VALUE = 'off';

interface AppLockContextValue {
  isAvailable: boolean;
  isPreferenceEnabled: boolean;
  isLocked: boolean;
  isGateVisible: boolean;
  unlock: () => Promise<boolean>;
  setPreferenceEnabled: (enabled: boolean) => Promise<boolean>;
}

const AppLockContext = createContext<AppLockContextValue | null>(null);

export function AppLockProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, isReady: isAuthReady } = useAuth();
  const { t } = useI18n();
  const [isPreferenceEnabled, setIsPreferenceEnabled] = useState(true);
  const [isAvailable, setIsAvailable] = useState(false);
  const [isSetupReady, setIsSetupReady] = useState(false);
  const [isLocked, setIsLocked] = useState(true);
  const [isCovered, setIsCovered] = useState(false);
  const backgroundedAt = useRef<number | null>(null);
  const isColdStartResolved = useRef(false);

  useEffect(() => {
    void Promise.all([preferenceStorage.get(preferenceKeys.appLock), canAuthenticateOnDevice()]).then(
      ([storedPreference, available]) => {
        setIsPreferenceEnabled(storedPreference !== APP_LOCK_DISABLED_VALUE);
        setIsAvailable(available);
        setIsSetupReady(true);
      },
    );
  }, []);

  useEffect(() => {
    if (!isAuthReady) {
      return;
    }
    if (!isColdStartResolved.current) {
      isColdStartResolved.current = true;
      if (!isAuthenticated) {
        setIsLocked(false);
      }
      return;
    }
    if (!isAuthenticated) {
      setIsLocked(false);
    }
  }, [isAuthReady, isAuthenticated]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        setIsCovered(false);
        if (shouldLockAfterBackground(backgroundedAt.current, Date.now())) {
          setIsLocked(true);
        }
        backgroundedAt.current = null;
        return;
      }
      setIsCovered(true);
      if (state === 'background' && backgroundedAt.current === null) {
        backgroundedAt.current = Date.now();
      }
    });
    return () => subscription.remove();
  }, []);

  const isEnforced = isPreferenceEnabled && isAvailable;
  const isGateVisible = isAuthenticated && (!isSetupReady || (isEnforced && (isLocked || isCovered)));

  const unlock = useCallback(async (): Promise<boolean> => {
    const succeeded = await authenticateOwner(t('appLock.prompt'));
    if (succeeded) {
      setIsLocked(false);
    }
    return succeeded;
  }, [t]);

  const setPreferenceEnabled = useCallback(
    async (enabled: boolean): Promise<boolean> => {
      if (!(await authenticateOwner(t('appLock.prompt')))) {
        return false;
      }
      await preferenceStorage.set(preferenceKeys.appLock, enabled ? 'on' : APP_LOCK_DISABLED_VALUE);
      setIsPreferenceEnabled(enabled);
      return true;
    },
    [t],
  );

  const value = useMemo<AppLockContextValue>(
    () => ({
      isAvailable,
      isPreferenceEnabled,
      isLocked: isEnforced && isLocked,
      isGateVisible,
      unlock,
      setPreferenceEnabled,
    }),
    [isAvailable, isPreferenceEnabled, isEnforced, isLocked, isGateVisible, unlock, setPreferenceEnabled],
  );

  return <AppLockContext.Provider value={value}>{children}</AppLockContext.Provider>;
}

export function useAppLock(): AppLockContextValue {
  const context = useContext(AppLockContext);
  if (!context) {
    throw new Error('useAppLock must be used inside AppLockProvider');
  }
  return context;
}
