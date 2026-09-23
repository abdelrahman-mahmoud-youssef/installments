import { useRouter } from 'expo-router';
import { ReactElement, useMemo } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, View } from 'react-native';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { SkeletonCardList } from '@/components/ui/skeleton';
import { useCounterparties } from '@/hooks/queries';
import { useI18n } from '@/i18n/i18n-context';
import { useTheme } from '@/theme/theme-context';
import { floatingActionClearance, spacing } from '@/theme/tokens';
import { ContactRow } from './contact-row';

interface ContactListProps {
  header: ReactElement;
  search: string;
}

export function ContactList({ header, search }: ContactListProps) {
  const { t } = useI18n();
  const { colors } = useTheme();
  const router = useRouter();
  const { data, isPending, isError, error, refetch, isRefetching, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useCounterparties({ q: search || undefined });

  const contacts = useMemo(() => data?.pages.flatMap((page) => page.data) ?? [], [data]);

  return (
    <FlatList
      data={contacts}
      keyExtractor={(contact) => contact.id}
      contentInsetAdjustmentBehavior="automatic"
      keyboardShouldPersistTaps="handled"
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
      ListHeaderComponent={header}
      ListEmptyComponent={
        <View style={{ paddingHorizontal: spacing.xl }}>
          {isPending ? (
            <SkeletonCardList count={4} />
          ) : isError ? (
            <ErrorState error={error} onRetry={() => void refetch()} />
          ) : search ? (
            <EmptyState icon="search-outline" title={t('contacts.emptySearch')} />
          ) : (
            <EmptyState icon="people-outline" title={t('contacts.empty')} message={t('contacts.emptyHint')} />
          )}
        </View>
      }
      ListFooterComponent={
        isFetchingNextPage ? <ActivityIndicator color={colors.textMuted} style={{ paddingVertical: spacing.lg }} /> : null
      }
      renderItem={({ item }) => (
        <View style={{ paddingHorizontal: spacing.xl }}>
          <ContactRow contact={item} onPress={() => router.push(`/contact/${item.id}`)} />
        </View>
      )}
    />
  );
}
