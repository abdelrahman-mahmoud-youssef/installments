import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, StyleSheet } from 'react-native';
import splashIcon from '../../../assets/splash-icon.png';
import { useI18n } from '@/i18n/i18n-context';
import { useTheme } from '@/theme/theme-context';
import { spacing } from '@/theme/tokens';
import { AppText } from './app-text';

const LOGO_SIZE = 220;
const LOGO_ENTER_DURATION = 260;
const HOLD_DURATION = 220;
const DISSOLVE_DURATION = 420;
const REDUCED_MOTION_DURATION = 180;

export function LaunchReveal() {
  const { colors } = useTheme();
  const { t } = useI18n();
  const [isDone, setIsDone] = useState(false);
  const logoScale = useRef(new Animated.Value(0.72)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;
  const overlayOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    let isCancelled = false;
    const finish = () => {
      if (!isCancelled) {
        setIsDone(true);
      }
    };

    void AccessibilityInfo.isReduceMotionEnabled().then((reduceMotion) => {
      if (isCancelled) {
        return;
      }
      if (reduceMotion) {
        Animated.timing(overlayOpacity, {
          toValue: 0,
          duration: REDUCED_MOTION_DURATION,
          useNativeDriver: true,
        }).start(finish);
        return;
      }
      Animated.sequence([
        Animated.parallel([
          Animated.spring(logoScale, { toValue: 1, friction: 6, tension: 70, useNativeDriver: true }),
          Animated.timing(contentOpacity, { toValue: 1, duration: LOGO_ENTER_DURATION, useNativeDriver: true }),
        ]),
        Animated.delay(HOLD_DURATION),
        Animated.parallel([
          Animated.timing(overlayOpacity, { toValue: 0, duration: DISSOLVE_DURATION, useNativeDriver: true }),
          Animated.timing(logoScale, { toValue: 1.12, duration: DISSOLVE_DURATION, useNativeDriver: true }),
        ]),
      ]).start(finish);
    });

    return () => {
      isCancelled = true;
    };
  }, [logoScale, contentOpacity, overlayOpacity]);

  if (isDone) {
    return null;
  }

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        StyleSheet.absoluteFill,
        {
          backgroundColor: colors.background,
          opacity: overlayOpacity,
          alignItems: 'center',
          justifyContent: 'center',
          gap: spacing.lg,
        },
      ]}
    >
      <Animated.Image
        source={splashIcon}
        resizeMode="contain"
        style={{ width: LOGO_SIZE, height: LOGO_SIZE, opacity: contentOpacity, transform: [{ scale: logoScale }] }}
      />
      <Animated.View style={{ opacity: contentOpacity }}>
        <AppText variant="title" tone="primary" align="center">
          {t('common.appName')}
        </AppText>
      </Animated.View>
    </Animated.View>
  );
}
