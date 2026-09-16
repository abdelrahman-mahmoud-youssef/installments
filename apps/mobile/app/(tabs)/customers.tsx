import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, View } from 'react-native';
import { CustomerCard } from '@/components/customers/customer-card';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { FilterChips } from '@/components/ui/filter-chips';
import { ScreenHeader } from '@/components/ui/screen-header';
import { SearchBar } from '@/components/ui/search-bar';
import { SkeletonCardList } from '@/components/ui/skeleton';
import { useCustomers } from '@/hooks/queries';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { useI18n } from '@/i18n/i18n-context';
import { useTheme } from '@/theme/theme-context';
import { spacing } from '@/theme/tokens';

type CustomerFilter = 'all' | 'delayed';

export default function CustomersScreen() {
  const { t } = useI18n();
  const { colors } = useTheme();
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<CustomerFilter>('all');
  const debouncedSearch = useDebouncedValue(search);

  const query = useCustomers({
    q: debouncedSearch.trim() || undefined,
    delayedOnly: filter === 'delayed' || undefined,
  });
  const { data, isPending, isError, error, refetch, isRefetching, fetchNextPage, hasNextPage, isFetchingNextPage } =
    query;

  const customers = useMemo(() => data?.pages.flatMap((page) => page.data) ?? [], [data]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <FlatList
        data={customers}
        keyExtractor={(customer) => customer.id}
        contentContainerStyle={{ paddingBottom: spacing.xxxl, gap: spacing.md, flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
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
          <View style={{ gap: spacing.md }}>
            <ScreenHeader title={t('customers.title')}>
              <SearchBar
                value={search}
                onChangeText={setSearch}
                placeholder={t('customers.searchPlaceholder')}
              />
            </ScreenHeader>
            <FilterChips
              options={[
                { value: 'all', label: t('common.all') },
                { value: 'delayed', label: t('customers.delayedOnly') },
              ]}
              selected={filter}
              onSelect={setFilter}
            />
          </View>
        }
        ListEmptyComponent={
          <View style={{ paddingHorizontal: spacing.xl }}>
            {isPending ? (
              <SkeletonCardList count={5} rows={1} />
            ) : isError ? (
              <ErrorState error={error} onRetry={() => void refetch()} />
            ) : debouncedSearch.trim() ? (
              <EmptyState icon="search-outline" title={t('customers.emptySearch')} />
            ) : (
              <EmptyState icon="people-outline" title={t('customers.empty')} message={t('customers.emptyHint')} />
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
            <CustomerCard customer={item} onPress={() => router.push(`/customer/${item.id}`)} />
          </View>
        )}
      />
    </View>
  );
}
