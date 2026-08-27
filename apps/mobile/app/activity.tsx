import { Stack } from 'expo-router';
import { useMemo } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, View } from 'react-native';
import { AppText } from '@/components/ui/app-text';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { SkeletonCardList } from '@/components/ui/skeleton';
import { useAuditLogs } from '@/hooks/queries';
import { useI18n } from '@/i18n/i18n-context';
import { formatDateTime } from '@/lib/format';
import { useTheme } from '@/theme/theme-context';
import { spacing } from '@/theme/tokens';

export default function ActivityScreen() {
  const { t, locale } = useI18n();
  const { colors } = useTheme();
  const { data, isPending, isError, error, refetch, isRefetching, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useAuditLogs();

  const entries = useMemo(() => data?.pages.flatMap((page) => page.data) ?? [], [data]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <Stack.Screen options={{ title: t('activity.title') }} />
      <FlatList
        data={entries}
        keyExtractor={(entry) => entry.id}
        contentContainerStyle={{ padding: spacing.xl, gap: spacing.md, flexGrow: 1 }}
        onEndReachedThreshold={0.4}
        onEndReached={() => {
          if (hasNextPage && !isFetchingNextPage) {
            void fetchNextPage();
          }
        }}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={() => void refetch()} tintColor={colors.textMuted} />
        }
        ListEmptyComponent={
          isPending ? (
            <SkeletonCardList count={5} rows={1} />
          ) : isError ? (
            <ErrorState error={error} onRetry={() => void refetch()} />
          ) : (
            <EmptyState icon="time-outline" title={t('activity.empty')} message={t('activity.emptyHint')} />
          )
        }
        ListFooterComponent={
          isFetchingNextPage ? (
            <ActivityIndicator color={colors.textMuted} style={{ paddingVertical: spacing.lg }} />
          ) : null
        }
        renderItem={({ item }) => (
          <Card>
            <View style={{ gap: spacing.sm }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                <View style={{ flex: 1 }}>
                  <AppText variant="bodyStrong" numberOfLines={1}>
                    {item.userName}
                  </AppText>
                </View>
                <Badge label={item.entityType} tone="info" />
              </View>
              <AppText variant="caption" tone="muted">
                {item.action}
              </AppText>
              <AppText variant="label" tone="faint">
                {formatDateTime(item.createdAt, locale)}
              </AppText>
            </View>
          </Card>
        )}
      />
    </View>
  );
}
