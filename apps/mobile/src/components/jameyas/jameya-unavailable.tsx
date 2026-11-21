import { Stack } from 'expo-router';
import { ScrollView } from 'react-native';
import { AppText } from '@/components/ui/app-text';
import { Card } from '@/components/ui/card';
import { useTheme } from '@/theme/theme-context';
import { spacing } from '@/theme/tokens';

export function JameyaUnavailable({ title, message }: { title: string; message: string }) {
  const { colors } = useTheme();
  return (
    <>
      <Stack.Screen options={{ title }} />
      <ScrollView
        style={{ backgroundColor: colors.background }}
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{ padding: spacing.xl }}
      >
        <Card>
          <AppText variant="caption" tone="muted">
            {message}
          </AppText>
        </Card>
      </ScrollView>
    </>
  );
}
