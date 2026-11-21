import { Stack, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl } from 'react-native';
import { JAMEYA_STATUSES, JameyaStatus } from '@/api/jameyas';
import { useAuth } from '@/auth/auth-context';
import { jameyaForbiddenMessage } from '@/components/jameyas/jameya-access';
import { JameyaListCard } from '@/components/jameyas/jameya-list-card';
import { JameyaUnavailable } from '@/components/jameyas/jameya-unavailable';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { FloatingActionBar } from '@/components/ui/floating-action-bar';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { SkeletonCardList } from '@/components/ui/skeleton';
import { useJameyas } from '@/hooks/queries';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { useI18n } from '@/i18n/i18n-context';
import { useHeaderSearchBarOptions } from '@/navigation/use-header-search-bar-options';
import { useTheme } from '@/theme/theme-context';
import { floatingActionClearance, spacing } from '@/theme/tokens';

export default function JameyasScreen() {
  const { t } = useI18n();
  const { colors } = useTheme();
  const router = useRouter();
  const { canUseJameyas } = useAuth();
  const [status, setStatus] = useState<JameyaStatus>('ACTIVE');
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search);
  const searchBarOptions = useHeaderSearchBarOptions({
    placeholder: t('jameyas.list.searchPlaceholder'),
    onSearch: setSearch,
  });
  const query = useJameyas({ status, q: debouncedSearch || undefined }, canUseJameyas);
  const { data, isPending, error, refetch, isRefetching, fetchNextPage, hasNextPage, isFetchingNextPage } = query;
  const jameyas = useMemo(() => data?.pages.flatMap((page) => page.data) ?? [], [data]);
  const forbiddenMessage = jameyaForbiddenMessage(error);
  const openNewJameya = () => router.push('/jameya/new');

  if (!canUseJameyas || forbiddenMessage) {
    return <JameyaUnavailable title={t('jameyas.title')} message={forbiddenMessage ?? t('jameyas.notEnabled')} />;
  }

  return (
    <>
      <Stack.Screen options={{ title: t('jameyas.title'), headerSearchBarOptions: searchBarOptions }} />
      <FlatList
        data={jameyas}
        keyExtractor={(jameya) => jameya.id}
        style={{ backgroundColor: colors.background }}
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{
          paddingHorizontal: spacing.xl,
          paddingTop: spacing.md,
          paddingBottom: spacing.xxxl + floatingActionClearance,
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
          <SegmentedControl
            options={JAMEYA_STATUSES.map((value) => ({ value, label: t(`jameyas.status.${value}`) }))}
            selected={status}
            onSelect={setStatus}
          />
        }
        ListEmptyComponent={
          isPending ? (
            <SkeletonCardList count={4} />
          ) : !data ? (
            <ErrorState error={error} onRetry={() => void refetch()} />
          ) : (
            <EmptyState
              icon="people-circle-outline"
              title={t('jameyas.list.empty')}
              message={t('jameyas.list.createPrompt')}
            />
          )
        }
        ListFooterComponent={
          isFetchingNextPage ? (
            <ActivityIndicator color={colors.textMuted} style={{ paddingVertical: spacing.lg }} />
          ) : null
        }
        renderItem={({ item }) => <JameyaListCard jameya={item} onPress={() => router.push(`/jameya/${item.id}`)} />}
      />
      <FloatingActionBar>
        <Button variant="glass" title={t('jameyas.newJameya')} icon="add-circle-outline" onPress={openNewJameya} />
      </FloatingActionBar>
    </>
  );
}
