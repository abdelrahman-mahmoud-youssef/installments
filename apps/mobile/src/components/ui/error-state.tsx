import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NetworkError } from '@/api/client';
import { useI18n } from '@/i18n/i18n-context';
import { useTheme } from '@/theme/theme-context';
import { spacing } from '@/theme/tokens';
import { AppText } from './app-text';
import { Button } from './button';

interface ErrorStateProps {
  error: unknown;
  onRetry: () => void;
}

export function ErrorState({ error, onRetry }: ErrorStateProps) {
  const { t } = useI18n();
  const { colors } = useTheme();
  const message = error instanceof NetworkError ? t('common.networkError') : t('common.genericError');
  return (
    <View style={{ alignItems: 'center', paddingVertical: spacing.xxxl, gap: spacing.md }}>
      <Ionicons name="cloud-offline-outline" size={36} color={colors.textFaint} />
      <AppText variant="caption" tone="muted" align="center" style={{ maxWidth: 260 }}>
        {message}
      </AppText>
      <Button title={t('common.retry')} onPress={onRetry} variant="secondary" />
    </View>
  );
}
