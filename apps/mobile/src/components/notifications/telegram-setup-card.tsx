import { useState } from 'react';
import { View } from 'react-native';
import { TELEGRAM_BOT_TOKEN_MAX_LENGTH } from '@/api/notification-settings';
import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { TextField } from '@/components/ui/text-field';
import { useI18n } from '@/i18n/i18n-context';
import { formatNumber } from '@/lib/format';
import { useTheme } from '@/theme/theme-context';
import { fontFamilies, radius, spacing } from '@/theme/tokens';

const SETUP_STEP_KEYS = ['step1', 'step2', 'step3', 'step4'] as const;
const STEP_NUMBER_SIZE = 24;

interface SetupStepProps {
  number: number;
  text: string;
}

function SetupStep({ number, text }: SetupStepProps) {
  const { locale } = useI18n();
  const { colors } = useTheme();
  return (
    <View style={{ flexDirection: 'row', gap: spacing.md, alignItems: 'flex-start' }}>
      <View
        style={{
          width: STEP_NUMBER_SIZE,
          height: STEP_NUMBER_SIZE,
          borderRadius: radius.full,
          backgroundColor: colors.primaryMuted,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <AppText variant="label" tone="primary">
          {formatNumber(number, locale)}
        </AppText>
      </View>
      <AppText variant="caption" tone="muted" style={{ flex: 1 }}>
        {text}
      </AppText>
    </View>
  );
}

interface TelegramSetupCardProps {
  connecting: boolean;
  error: string | null;
  onConnect: (token: string) => void;
}

export function TelegramSetupCard({ connecting, error, onConnect }: TelegramSetupCardProps) {
  const { t } = useI18n();
  const [token, setToken] = useState('');
  const [tokenError, setTokenError] = useState<string | null>(null);

  const submit = () => {
    const trimmedToken = token.trim();
    if (!trimmedToken) {
      setTokenError(t('common.requiredField'));
      return;
    }
    setTokenError(null);
    onConnect(trimmedToken);
  };

  return (
    <Card>
      <View style={{ gap: spacing.lg }}>
        <View style={{ gap: spacing.md }}>
          <AppText variant="bodyStrong">{t('notifications.stepsTitle')}</AppText>
          {SETUP_STEP_KEYS.map((stepKey, index) => (
            <SetupStep key={stepKey} number={index + 1} text={t(`notifications.${stepKey}`)} />
          ))}
        </View>
        <TextField
          label={t('notifications.tokenLabel')}
          placeholder={t('notifications.tokenPlaceholder')}
          value={token}
          onChangeText={setToken}
          error={tokenError ?? error ?? undefined}
          maxLength={TELEGRAM_BOT_TOKEN_MAX_LENGTH}
          autoCapitalize="none"
          autoCorrect={false}
          spellCheck={false}
          style={{ fontFamily: fontFamilies.monospace, textAlign: 'left', writingDirection: 'ltr' }}
        />
        <Button
          title={t('notifications.connectAndTest')}
          icon="paper-plane-outline"
          onPress={submit}
          loading={connecting}
        />
      </View>
    </Card>
  );
}
