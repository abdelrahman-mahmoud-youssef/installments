import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useAuth } from '@/auth/auth-context';
import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { ConfirmSheet } from '@/components/ui/confirm-sheet';
import { useI18n } from '@/i18n/i18n-context';
import { useAppLock } from '@/security/app-lock-context';
import { useTheme } from '@/theme/theme-context';
import { radius, spacing } from '@/theme/tokens';

const CONTENT_MAX_WIDTH = 420;

export function AppLockGate() {
  const { t, direction } = useI18n();
  const { colors } = useTheme();
  const { signOut } = useAuth();
  const { isLocked, isGateVisible, unlock } = useAppLock();
  const [signOutVisible, setSignOutVisible] = useState(false);
  const [isUnlocking, setIsUnlocking] = useState(false);
  const isPrompting = useRef(false);

  const requestUnlock = useCallback(async () => {
    if (isPrompting.current) {
      return;
    }
    isPrompting.current = true;
    setIsUnlocking(true);
    try {
      await unlock();
    } finally {
      isPrompting.current = false;
      setIsUnlocking(false);
    }
  }, [unlock]);

  useEffect(() => {
    if (isLocked) {
      void requestUnlock();
    }
  }, [isLocked, requestUnlock]);

  if (!isGateVisible) {
    return null;
  }

  return (
    <View
      style={[
        StyleSheet.absoluteFill,
        { direction, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' },
      ]}
    >
      <View style={{ width: '100%', maxWidth: CONTENT_MAX_WIDTH, padding: spacing.xl, gap: spacing.lg }}>
        <View
          style={{
            alignSelf: 'center',
            width: 64,
            height: 64,
            borderRadius: radius.full,
            backgroundColor: colors.primaryMuted,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons name="lock-closed-outline" size={30} color={colors.primary} />
        </View>
        {isLocked ? (
          <>
            <AppText variant="title" align="center">
              {t('appLock.title')}
            </AppText>
            <AppText tone="muted" align="center">
              {t('appLock.message')}
            </AppText>
            <View style={{ gap: spacing.md, marginTop: spacing.sm }}>
              <Button
                title={t('appLock.unlock')}
                icon="finger-print-outline"
                loading={isUnlocking}
                onPress={() => void requestUnlock()}
              />
              <Button title={t('more.signOut')} variant="ghost" onPress={() => setSignOutVisible(true)} />
            </View>
          </>
        ) : null}
      </View>
      <ConfirmSheet
        visible={signOutVisible}
        title={t('more.signOutTitle')}
        message={t('more.signOutConfirm')}
        confirmTitle={t('more.signOut')}
        destructive
        onConfirm={() => {
          setSignOutVisible(false);
          void signOut();
        }}
        onCancel={() => setSignOutVisible(false)}
      />
    </View>
  );
}
