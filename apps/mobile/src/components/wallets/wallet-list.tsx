import { useRouter } from 'expo-router';
import { ReactElement, useMemo, useState } from 'react';
import { FlatList, RefreshControl, ScrollViewProps, View } from 'react-native';
import { PaymentMethod } from '@/api/payment-methods';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { SkeletonCardList } from '@/components/ui/skeleton';
import { usePaymentMethods } from '@/hooks/queries';
import { useI18n } from '@/i18n/i18n-context';
import { useTheme } from '@/theme/theme-context';
import { floatingActionClearance, spacing } from '@/theme/tokens';
import { PaymentMethodCard } from './payment-method-card';
import { WalletActions } from './wallet-actions';

interface WalletListProps {
  header: ReactElement;
  search: string;
  scrollProps?: Pick<ScrollViewProps, 'onScroll' | 'scrollEventThrottle'>;
}

function matchesSearch(method: PaymentMethod, search: string): boolean {
  const needle = search.toLowerCase();
  return method.label.toLowerCase().includes(needle) || method.details.toLowerCase().includes(needle);
}

export function WalletList({ header, search, scrollProps }: WalletListProps) {
  const { t } = useI18n();
  const { colors } = useTheme();
  const router = useRouter();
  const { data, isPending, isError, error, refetch, isRefetching } = usePaymentMethods();
  const [actionMethod, setActionMethod] = useState<PaymentMethod | null>(null);

  const methods = useMemo(() => {
    const all = data ?? [];
    return search ? all.filter((method) => matchesSearch(method, search)) : all;
  }, [data, search]);
  const primaryMethodId = useMemo(() => data?.find((method) => method.isActive)?.id ?? null, [data]);

  return (
    <>
      <FlatList
        {...scrollProps}
        data={methods}
        keyExtractor={(method) => method.id}
        contentInsetAdjustmentBehavior="automatic"
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          paddingTop: spacing.md,
          paddingBottom: spacing.xxxl + floatingActionClearance,
          gap: spacing.md,
          flexGrow: 1,
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
              <EmptyState icon="search-outline" title={t('wallets.emptySearch')} />
            ) : (
              <EmptyState icon="wallet-outline" title={t('wallets.empty')} message={t('wallets.emptyHint')} />
            )}
          </View>
        }
        renderItem={({ item }) => (
          <View style={{ paddingHorizontal: spacing.xl }}>
            <PaymentMethodCard
              method={item}
              isPrimary={item.id === primaryMethodId}
              onPress={() => router.push(`/wallet/${item.id}`)}
              onLongPress={() => setActionMethod(item)}
            />
          </View>
        )}
      />
      <WalletActions method={actionMethod} onClose={() => setActionMethod(null)} />
    </>
  );
}
