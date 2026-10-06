import { Stack, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, View } from 'react-native';
import { ContractStatus } from '@/api/contracts';
import { useAuth } from '@/auth/auth-context';
import { ContractCard } from '@/components/contracts/contract-card';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { FloatingActionBar } from '@/components/ui/floating-action-bar';
import { FilterChips } from '@/components/ui/filter-chips';
import { SkeletonCardList } from '@/components/ui/skeleton';
import { useContracts, useContractTags } from '@/hooks/queries';
import { useI18n } from '@/i18n/i18n-context';
import { useTheme } from '@/theme/theme-context';
import { floatingActionClearance, spacing } from '@/theme/tokens';

type ContractFilter = 'all' | ContractStatus | 'delayed';

const ALL_TAGS = '__all__';

export default function ContractsScreen() {
  const { t } = useI18n();
  const { colors } = useTheme();
  const { isAdmin } = useAuth();
  const router = useRouter();
  const [filter, setFilter] = useState<ContractFilter>('all');
  const [tag, setTag] = useState<string>(ALL_TAGS);
  const tagsQuery = useContractTags(isAdmin);
  const tags = tagsQuery.data ?? [];

  const query = useContracts({
    status: filter === 'all' || filter === 'delayed' ? undefined : filter,
    delayedOnly: filter === 'delayed' || undefined,
    tag: tag === ALL_TAGS ? undefined : tag,
  });
  const { data, isPending, isError, error, refetch, isRefetching, fetchNextPage, hasNextPage, isFetchingNextPage } =
    query;

  const contracts = useMemo(() => data?.pages.flatMap((page) => page.data) ?? [], [data]);
  const openNewContract = () => router.push('/contract/new');

  return (
    <>
      <Stack.Screen options={{ title: t('contracts.title') }} />
      <FlatList
        data={contracts}
        keyExtractor={(contract) => contract.id}
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{
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
          <View style={{ gap: spacing.sm }}>
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
            {tags.length > 0 ? (
              <FilterChips
                options={[
                  { value: ALL_TAGS, label: t('contractForm.allTags') },
                  ...tags.map((value) => ({ value, label: `# ${value}` })),
                ]}
                selected={tag}
                onSelect={setTag}
              />
            ) : null}
          </View>
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
                actionTitle={t('contractForm.title')}
                onAction={openNewContract}
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
      <FloatingActionBar>
        <Button variant="glass" title={t('contractForm.title')} icon="add-circle-outline" onPress={openNewContract} />
      </FloatingActionBar>
    </>
  );
}
