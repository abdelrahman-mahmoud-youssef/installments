import { Stack, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, View } from 'react-native';
import { CustomerListItem } from '@/api/customers';
import { CustomerCard } from '@/components/customers/customer-card';
import { CustomerFormSheet } from '@/components/customers/customer-form-sheet';
import { Button } from '@/components/ui/button';
import { ConfirmSheet } from '@/components/ui/confirm-sheet';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { FilterChips } from '@/components/ui/filter-chips';
import { FloatingActionBar } from '@/components/ui/floating-action-bar';
import { SkeletonCardList } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/toast-context';
import { useCreateCustomer, useCustomers, useDeleteCustomer } from '@/hooks/queries';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { useI18n } from '@/i18n/i18n-context';
import { useTheme } from '@/theme/theme-context';
import { floatingActionClearance, spacing } from '@/theme/tokens';

type CustomerFilter = 'active' | 'delayed' | 'deleted';

export default function CustomersScreen() {
  const { t } = useI18n();
  const { colors } = useTheme();
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<CustomerFilter>('active');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<CustomerListItem | null>(null);
  const debouncedSearch = useDebouncedValue(search);
  const { showToast } = useToast();
  const createCustomer = useCreateCustomer();
  const deleteCustomer = useDeleteCustomer();

  const query = useCustomers({
    q: debouncedSearch.trim() || undefined,
    status: filter === 'deleted' ? 'DELETED' : 'ACTIVE',
    delayedOnly: filter === 'delayed' || undefined,
  });

  const confirmDelete = async () => {
    if (!pendingDelete) {
      return;
    }
    try {
      await deleteCustomer.mutateAsync(pendingDelete.id);
      showToast(t('customerActions.deletedToast'));
    } catch {
      showToast(t('common.genericError'), 'error');
    } finally {
      setPendingDelete(null);
    }
  };
  const { data, isPending, isError, error, refetch, isRefetching, fetchNextPage, hasNextPage, isFetchingNextPage } =
    query;

  const customers = useMemo(() => data?.pages.flatMap((page) => page.data) ?? [], [data]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <Stack.Screen
        options={{
          title: t('customers.title'),
          headerSearchBarOptions: {
            placeholder: t('customers.searchPlaceholder'),
            cancelButtonText: t('common.cancel'),
            autoCapitalize: 'none',
            hideWhenScrolling: false,
            onChangeText: (event) => setSearch(event.nativeEvent.text),
          },
        }}
      />
      <FlatList
        data={customers}
        keyExtractor={(customer) => customer.id}
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{
          paddingTop: spacing.md,
          paddingBottom: spacing.xxxl + floatingActionClearance,
          gap: spacing.md,
          flexGrow: 1,
        }}
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
          <FilterChips
            options={[
              { value: 'active', label: t('common.active') },
              { value: 'delayed', label: t('customers.delayedOnly') },
              { value: 'deleted', label: t('customerActions.deletedFilter') },
            ]}
            selected={filter}
            onSelect={setFilter}
          />
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
              <EmptyState
                icon="people-outline"
                title={t('customers.empty')}
                message={t('customers.emptyHint')}
                actionTitle={t('customerForm.newTitle')}
                onAction={() => setIsFormOpen(true)}
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
            <CustomerCard
              customer={item}
              onPress={() => router.push(`/customer/${item.id}`)}
              onLongPress={item.status === 'ACTIVE' ? () => setPendingDelete(item) : undefined}
            />
          </View>
        )}
      />
      <FloatingActionBar>
        <Button
          variant="glass"
          title={t('customerForm.newTitle')}
          icon="person-add-outline"
          onPress={() => setIsFormOpen(true)}
        />
      </FloatingActionBar>
      <CustomerFormSheet
        visible={isFormOpen}
        customer={null}
        saving={createCustomer.isPending}
        onClose={() => setIsFormOpen(false)}
        onSubmit={async (input) => {
          const customer = await createCustomer.mutateAsync(input);
          setIsFormOpen(false);
          showToast(t('customerForm.created'));
          router.push(`/customer/${customer.id}`);
        }}
      />
      <ConfirmSheet
        visible={pendingDelete !== null}
        title={t('customerActions.deleteTitle')}
        message={pendingDelete ? t('customerActions.deleteConfirm', { name: pendingDelete.name }) : ''}
        confirmTitle={t('customerActions.delete')}
        destructive
        loading={deleteCustomer.isPending}
        onConfirm={() => void confirmDelete()}
        onCancel={() => setPendingDelete(null)}
      />
    </View>
  );
}
