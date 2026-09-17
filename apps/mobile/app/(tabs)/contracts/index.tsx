import { Stack, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, View } from 'react-native';
import { ContractStatus } from '@/api/contracts';
import { ContractCard } from '@/components/contracts/contract-card';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { FilterChips } from '@/components/ui/filter-chips';
import { SkeletonCardList } from '@/components/ui/skeleton';
import { useContracts } from '@/hooks/queries';
import { useI18n } from '@/i18n/i18n-context';
import { useTheme } from '@/theme/theme-context';
import { spacing } from '@/theme/tokens';

type ContractFilter = 'all' | ContractStatus | 'delayed';

export default function ContractsScreen() {
  const { t } = useI18n();
  const { colors } = useTheme();
  const router = useRouter();
  const [filter, setFilter] = useState<ContractFilter>('all');

  const query = useContracts({
    status: filter === 'all' || filter === 'delayed' ? undefined : filter,
    delayedOnly: filter === 'delayed' || undefined,
  });
  const { data, isPending, isError, error, refetch, isRefetching, fetchNextPage, hasNextPage, isFetchingNextPage } =
    query;

  const contracts = useMemo(() => data?.pages.flatMap((page) => page.data) ?? [], [data]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <Stack.Screen options={{ title: t('contracts.title') }} />
      <FlatList
        data={contracts}
        keyExtractor={(contract) => contract.id}
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{ paddingTop: spacing.md, paddingBottom: spacing.xxxl, gap: spacing.md, flexGrow: 1 }}
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
          <FilterChips
            options={[
              { value: 'all', label: t('contracts.filterAll') },
              { value: 'ACTIVE', label: t('contracts.filterActive') },
              { value: 'delayed', label: t('contracts.filterDelayed') },
              { value: 'COMPLETED', label: t('contracts.filterCompleted') },
              { value: 'CANCELLED', label: t('contracts.filterCancelled') },
            ]}
            selected={filter}
            onSelect={setFilter}
          />
        }
        ListEmptyComponent={
          <View style={{ paddingHorizontal: spacing.xl }}>
            {isPending ? (
              <SkeletonCardList count={5} />
            ) : isError ? (
              <ErrorState error={error} onRetry={() => void refetch()} />
            ) : (
              <EmptyState
                icon="document-text-outline"
                title={t('contracts.empty')}
                message={t('contracts.emptyHint')}
              />
            )}
          </View>
        }
        ListFooterComponent={
          isFetchingNextPage ? (
            <ActivityIndicator color={colors.textMuted} style={{ paddingVertical: spacing.lg }} />
          ) : null
        }
        renderItem={({ item }) => (
          <View style={{ paddingHorizontal: spacing.xl }}>
            <ContractCard contract={item} onPress={() => router.push(`/contract/${item.id}`)} />
          </View>
        )}
      />
    </View>
  );
}
