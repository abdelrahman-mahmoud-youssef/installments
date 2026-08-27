import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { ReactNode, useEffect } from 'react';
import { useAuth, AuthProvider } from '@/auth/auth-context';
import { ToastProvider } from '@/components/ui/toast-context';
import { I18nProvider, useI18n } from '@/i18n/i18n-context';
import { ThemeProvider, useTheme } from '@/theme/theme-context';

void SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30_000 },
  },
});

function AuthGate({ children }: { children: ReactNode }) {
  const { isAuthenticated, isReady: authReady } = useAuth();
  const { isReady: themeReady } = useTheme();
  const { isReady: i18nReady } = useI18n();
  const segments = useSegments();
  const router = useRouter();
  const isReady = authReady && themeReady && i18nReady;

  useEffect(() => {
    if (!isReady) {
      return;
    }
    void SplashScreen.hideAsync();
    const isOnLogin = segments[0] === 'login';
    if (!isAuthenticated && !isOnLogin) {
      router.replace('/login');
    } else if (isAuthenticated && isOnLogin) {
      router.replace('/');
    }
  }, [isReady, isAuthenticated, segments, router]);

  if (!isReady) {
    return null;
  }
  return <>{children}</>;
}

function ThemedNavigator() {
  const { colors, isDark } = useTheme();
  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <AuthGate>
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: colors.background },
            headerTintColor: colors.text,
            headerShadowVisible: false,
            headerBackButtonDisplayMode: 'minimal',
            contentStyle: { backgroundColor: colors.background },
          }}
        >
          <Stack.Screen name="login" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        </Stack>
      </AuthGate>
    </>
  );
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <I18nProvider>
        <ThemeProvider>
          <ToastProvider>
            <AuthProvider>
              <ThemedNavigator />
            </AuthProvider>
          </ToastProvider>
        </ThemeProvider>
      </I18nProvider>
    </QueryClientProvider>
  );
}
