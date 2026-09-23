import { Stack, useRouter } from 'expo-router';
import { useMemo } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, View } from 'react-native';
import { useAuth } from '@/auth/auth-context';
import { AnnouncementCard } from '@/components/announcements/announcement-card';
import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { FloatingActionBar } from '@/components/ui/floating-action-bar';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { SkeletonCardList } from '@/components/ui/skeleton';
import { useAnnouncements } from '@/hooks/queries';
import { useI18n } from '@/i18n/i18n-context';
import { useTheme } from '@/theme/theme-context';
import { floatingActionClearance, spacing } from '@/theme/tokens';

export default function AnnouncementsScreen() {
  const { t } = useI18n();
  const { colors } = useTheme();
  const { isAdmin } = useAuth();
  const router = useRouter();
  const { data, isPending, isError, error, refetch, isRefetching, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useAnnouncements();

  const announcements = useMemo(() => data?.pages.flatMap((page) => page.data) ?? [], [data]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <Stack.Screen options={{ title: t('announcements.title') }} />
      <FlatList
        data={announcements}
        keyExtractor={(announcement) => announcement.id}
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{
          padding: spacing.xl,
          paddingBottom: spacing.xxxl + (isAdmin ? floatingActionClearance : 0),
          gap: spacing.md,
          flexGrow: 1,
        }}
        onEndReachedThreshold={0.4}
        onEndReached={() => {
          if (hasNextPage && !isFetchingNextPage) {
            void fetchNextPage();
          }
        }}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={() => void refetch()} tintColor={colors.textMuted} />
        }
        ListHeaderComponent={
          <AppText variant="caption" tone="muted">
            {isAdmin ? t('announcements.subtitle') : t('announcements.adminOnly')}
          </AppText>
        }
        ListEmptyComponent={
          isPending ? (
            <SkeletonCardList count={3} rows={2} />
          ) : isError ? (
            <ErrorState error={error} onRetry={() => void refetch()} />
          ) : (
            <EmptyState
              icon="megaphone-outline"
              title={t('announcements.empty')}
              message={t('announcements.emptyHint')}
            />
          )
        }
        ListFooterComponent={
          isFetchingNextPage ? (
            <ActivityIndicator color={colors.textMuted} style={{ paddingVertical: spacing.lg }} />
          ) : null
        }
        renderItem={({ item }) => <AnnouncementCard announcement={item} />}
      />

      {isAdmin ? (
        <FloatingActionBar>
          <Button
            variant="glass"
            title={t('announcements.newAnnouncement')}
            icon="megaphone-outline"
            onPress={() => router.push('/new-announcement')}
          />
        </FloatingActionBar>
      ) : null}
    </View>
  );
}
