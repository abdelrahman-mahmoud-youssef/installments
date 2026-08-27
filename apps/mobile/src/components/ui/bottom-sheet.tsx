import { ReactNode, useCallback, useEffect, useRef, useState } from 'react';
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
import { useTheme } from '@/theme/theme-context';
import { radius, spacing } from '@/theme/tokens';
import { AppText } from './app-text';

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
  const insets = useSafeAreaInsets();
  const [isMounted, setIsMounted] = useState(visible);
  const progress = useRef(new Animated.Value(0)).current;

  const animate = useCallback(
    (toValue: number, onDone?: () => void) => {
      Animated.timing(progress, {
        toValue,
        duration: ANIMATION_DURATION,
        useNativeDriver: true,
      }).start(onDone);
    },
    [progress],
  );

  useEffect(() => {
    if (visible) {
      setIsMounted(true);
      animate(1);
    } else if (isMounted) {
      animate(0, () => setIsMounted(false));
    }
  }, [visible, isMounted, animate]);

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
        style={{ flex: 1, justifyContent: 'flex-end' }}
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
        <Animated.View
          style={{
            transform: [{ translateY }],
            backgroundColor: colors.surface,
            borderTopLeftRadius: radius.xl,
            borderTopRightRadius: radius.xl,
            paddingTop: spacing.md,
            paddingHorizontal: spacing.xl,
            paddingBottom: insets.bottom + spacing.xl,
            maxHeight: '88%',
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
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
