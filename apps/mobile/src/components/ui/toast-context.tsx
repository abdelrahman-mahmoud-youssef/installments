import { createContext, ReactNode, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useI18n } from '@/i18n/i18n-context';
import { notificationHaptic } from '@/lib/haptics';
import { useTheme } from '@/theme/theme-context';
import { radius, spacing } from '@/theme/tokens';
import { AppText } from './app-text';
import { GlassSurface } from './glass-surface';

type ToastTone = 'success' | 'error';

interface ToastContextValue {
  showToast: (message: string, tone?: ToastTone) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);
const VISIBLE_DURATION = 2400;

export function ToastProvider({ children }: { children: ReactNode }) {
  const { colors } = useTheme();
  const { direction } = useI18n();
  const insets = useSafeAreaInsets();
  const [toast, setToast] = useState<{ message: string; tone: ToastTone } | null>(null);
  const opacity = useRef(new Animated.Value(0)).current;
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback(
    (message: string, tone: ToastTone = 'success') => {
      if (hideTimer.current) {
        clearTimeout(hideTimer.current);
      }
      notificationHaptic(tone);
      setToast({ message, tone });
      Animated.timing(opacity, { toValue: 1, duration: 180, useNativeDriver: true }).start();
      hideTimer.current = setTimeout(() => {
        Animated.timing(opacity, { toValue: 0, duration: 220, useNativeDriver: true }).start(() =>
          setToast(null),
        );
      }, VISIBLE_DURATION);
    },
    [opacity],
  );

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {toast ? (
        <Animated.View
          pointerEvents="none"
          style={{
            position: 'absolute',
            direction,
            top: insets.top + spacing.md,
            left: spacing.xl,
            right: spacing.xl,
            opacity,
            alignItems: 'center',
          }}
        >
          <GlassSurface
            elevated
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: spacing.sm,
              borderRadius: radius.full,
              paddingHorizontal: spacing.xl,
              paddingVertical: spacing.md,
            }}
          >
            <Ionicons
              name={toast.tone === 'success' ? 'checkmark-circle' : 'alert-circle'}
              size={18}
              color={toast.tone === 'success' ? colors.success : colors.danger}
            />
            <AppText variant="caption" style={{ flexShrink: 1 }}>
              {toast.message}
            </AppText>
          </GlassSurface>
        </Animated.View>
      ) : null}
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
}
