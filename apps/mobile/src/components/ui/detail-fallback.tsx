import { Stack } from 'expo-router';
import { ScrollView, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme/theme-context';
import { spacing } from '@/theme/tokens';
import { AppText } from './app-text';
import { Card } from './card';
import { EmptyState } from './empty-state';
import { ErrorState } from './error-state';
import { SkeletonCardList } from './skeleton';

interface DetailFallbackProps {
  isAllowed: boolean;
  notAllowedMessage: string;
  isPending: boolean;
  error: unknown;
  onRetry: () => void;
  notFoundIcon: keyof typeof Ionicons.glyphMap;
  notFoundTitle: string;
}

export function DetailFallback({
  isAllowed,
  notAllowedMessage,
  isPending,
  error,
  onRetry,
  notFoundIcon,
  notFoundTitle,
}: DetailFallbackProps) {
  const { colors } = useTheme();

  const content = !isAllowed ? (
    <Card>
      <AppText variant="caption" tone="muted">
        {notAllowedMessage}
      </AppText>
    </Card>
  ) : isPending ? (
    <SkeletonCardList count={3} />
  ) : error ? (
    <ErrorState error={error} onRetry={onRetry} />
  ) : (
    <EmptyState icon={notFoundIcon} title={notFoundTitle} />
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <Stack.Screen options={{ title: '' }} />
      <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={{ padding: spacing.xl }}>
        {content}
      </ScrollView>
    </View>
  );
}
