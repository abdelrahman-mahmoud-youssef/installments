import { Stack } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { FlatList, RefreshControl, View } from 'react-native';
import { SupportFormSheet } from '@/components/support/support-form-sheet';
import { SupportMessageCard } from '@/components/support/support-message-card';
import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { FloatingActionBar } from '@/components/ui/floating-action-bar';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { SkeletonCardList } from '@/components/ui/skeleton';
import { useMarkSupportRepliesSeen, useSupportMessages } from '@/hooks/queries';
import { useI18n } from '@/i18n/i18n-context';
import { countUnseenReplies } from '@/lib/support-replies';
import { useTheme } from '@/theme/theme-context';
import { floatingActionClearance, spacing } from '@/theme/tokens';

export default function SupportScreen() {
  const { t } = useI18n();
  const { colors } = useTheme();
  const [formVisible, setFormVisible] = useState(false);
  const { data, isPending, isError, error, refetch, isRefetching } = useSupportMessages();
  const { mutate: markSeen } = useMarkSupportRepliesSeen();
  const hasRequestedMarkSeen = useRef(false);

  const unseenCount = countUnseenReplies(data ?? []);

  useEffect(() => {
    if (unseenCount > 0 && !hasRequestedMarkSeen.current) {
      hasRequestedMarkSeen.current = true;
      markSeen();
    }
  }, [unseenCount, markSeen]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <Stack.Screen options={{ title: t('support.title') }} />
      <FlatList
        data={data ?? []}
        keyExtractor={(message) => message.id}
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{
          padding: spacing.xl,
          paddingBottom: spacing.xxxl + floatingActionClearance,
          gap: spacing.md,
          flexGrow: 1,
        }}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={() => void refetch()} tintColor={colors.textMuted} />
        }
        ListHeaderComponent={
          <AppText variant="caption" tone="muted">
            {t('support.subtitle')}
          </AppText>
        }
        ListEmptyComponent={
          isPending ? (
            <SkeletonCardList count={3} rows={2} />
          ) : isError ? (
            <ErrorState error={error} onRetry={() => void refetch()} />
          ) : (
            <EmptyState icon="chatbubbles-outline" title={t('support.empty')} message={t('support.emptyHint')} />
          )
        }
        renderItem={({ item }) => <SupportMessageCard message={item} />}
      />

      <FloatingActionBar>
        <Button
          variant="glass"
          title={t('support.newMessage')}
          icon="create-outline"
          onPress={() => setFormVisible(true)}
        />
      </FloatingActionBar>

      <SupportFormSheet visible={formVisible} onClose={() => setFormVisible(false)} />
    </View>
  );
}
