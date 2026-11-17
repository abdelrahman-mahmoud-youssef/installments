import { ReactNode, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import {
  Animated,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useI18n } from '@/i18n/i18n-context';
import { useTheme } from '@/theme/theme-context';
import { radius, spacing } from '@/theme/tokens';
import { AppText } from './app-text';
import { GlassSurface } from './glass-surface';
import { canPresentSheet, holdSheetClosing, useCanPresentSheet } from './sheet-presentation';

const ANIMATION_DURATION = 240;

interface BottomSheetProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  scrollable?: boolean;
}

export function BottomSheet({ visible, onClose, title, children, scrollable = true }: BottomSheetProps) {
  const { colors } = useTheme();
  const { direction } = useI18n();
  const insets = useSafeAreaInsets();
  const canPresent = useCanPresentSheet();
  const [isMounted, setIsMounted] = useState(false);
  const progress = useRef(new Animated.Value(0)).current;
  const releaseClosingRef = useRef<(() => void) | null>(null);

  const releaseClosing = useCallback(() => {
    releaseClosingRef.current?.();
    releaseClosingRef.current = null;
  }, []);

  const animate = useCallback(
    (toValue: number, onFinished?: () => void) => {
      Animated.timing(progress, {
        toValue,
        duration: ANIMATION_DURATION,
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished) {
          onFinished?.();
        }
      });
    },
    [progress],
  );

  useLayoutEffect(() => {
    if (!visible && isMounted) {
      releaseClosingRef.current ??= holdSheetClosing();
    }
  }, [visible, isMounted]);

  useEffect(() => {
    if (visible && !isMounted && canPresent && canPresentSheet()) {
      setIsMounted(true);
    }
  }, [visible, isMounted, canPresent]);

  useEffect(() => {
    if (!isMounted) {
      return;
    }
    if (visible) {
      releaseClosing();
      animate(1);
    } else {
      animate(0, () => setIsMounted(false));
    }
  }, [visible, isMounted, animate, releaseClosing]);

  useEffect(() => {
    if (!isMounted) {
      releaseClosing();
    }
  }, [isMounted, releaseClosing]);

  useEffect(() => releaseClosing, [releaseClosing]);

  if (!isMounted) {
    return null;
  }

  const translateY = progress.interpolate({ inputRange: [0, 1], outputRange: [420, 0] });
  const content = (
    <View style={{ gap: spacing.lg }}>
      {title ? <AppText variant="title">{title}</AppText> : null}
      {children}
    </View>
  );

  return (
    <Modal transparent visible animationType="none" onRequestClose={onClose} statusBarTranslucent>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1, direction, justifyContent: 'flex-end' }}
      >
        <Animated.View
          style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: colors.overlay,
            opacity: progress,
          }}
        >
          <Pressable style={{ flex: 1 }} onPress={onClose} accessibilityRole="button" />
        </Animated.View>
        <Animated.View style={{ transform: [{ translateY }], maxHeight: '88%' }}>
          <GlassSurface
            style={{
              flexShrink: 1,
              borderTopLeftRadius: radius.xl,
              borderTopRightRadius: radius.xl,
              paddingTop: spacing.md,
              paddingHorizontal: spacing.xl,
              paddingBottom: insets.bottom + spacing.xl,
            }}
          >
            <View
              style={{
                alignSelf: 'center',
                width: 40,
                height: 4,
                borderRadius: radius.full,
                backgroundColor: colors.border,
                marginBottom: spacing.lg,
              }}
            />
            {scrollable ? (
              <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
                {content}
              </ScrollView>
            ) : (
              content
            )}
          </GlassSurface>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
