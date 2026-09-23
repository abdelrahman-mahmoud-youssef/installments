import { Stack } from 'expo-router';
import { useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, View } from 'react-native';
import { PaymentClaim, PaymentClaimStatus } from '@/api/payment-claims';
import { ClaimReviewSheet } from '@/components/payment-claims/claim-review-sheet';
import { PaymentClaimCard } from '@/components/payment-claims/payment-claim-card';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { SegmentedControl, SegmentOption } from '@/components/ui/segmented-control';
import { SkeletonCardList } from '@/components/ui/skeleton';
import { usePaymentClaims } from '@/hooks/queries';
import { useI18n } from '@/i18n/i18n-context';
import { useTheme } from '@/theme/theme-context';
import { spacing } from '@/theme/tokens';

type ClaimFilter = PaymentClaimStatus | 'ALL';

export default function PaymentClaimsScreen() {
  const { t } = useI18n();
  const { colors } = useTheme();
  const [filter, setFilter] = useState<ClaimFilter>('PENDING');
  const [selectedClaim, setSelectedClaim] = useState<PaymentClaim | null>(null);

  const query = usePaymentClaims({ status: filter === 'ALL' ? undefined : filter });
  const { data, isPending, isError, error, refetch, isRefetching, fetchNextPage, hasNextPage, isFetchingNextPage } =
    query;
  const claims = useMemo(() => data?.pages.flatMap((page) => page.data) ?? [], [data]);

  const filterOptions: SegmentOption<ClaimFilter>[] = [
    { value: 'PENDING', label: t('paymentClaims.status.PENDING') },
    { value: 'APPROVED', label: t('paymentClaims.status.APPROVED') },
    { value: 'DECLINED', label: t('paymentClaims.status.DECLINED') },
    { value: 'ALL', label: t('common.all') },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <Stack.Screen options={{ title: t('paymentClaims.title') }} />
      <FlatList
        data={claims}
        keyExtractor={(claim) => claim.id}
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{
          paddingHorizontal: spacing.xl,
          paddingTop: spacing.md,
          paddingBottom: spacing.xxxl,
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
        ListHeaderComponent={<SegmentedControl options={filterOptions} selected={filter} onSelect={setFilter} />}
        ListEmptyComponent={
          isPending ? (
            <SkeletonCardList count={4} />
          ) : isError ? (
            <ErrorState error={error} onRetry={() => void refetch()} />
          ) : (
            <EmptyState
              icon="receipt-outline"
              title={filter === 'PENDING' ? t('paymentClaims.emptyPending') : t('paymentClaims.empty')}
              message={t('paymentClaims.emptyHint')}
            />
          )
        }
        ListFooterComponent={
          isFetchingNextPage ? (
            <ActivityIndicator color={colors.textMuted} style={{ paddingVertical: spacing.lg }} />
          ) : null
        }
        renderItem={({ item }) => <PaymentClaimCard claim={item} onPress={() => setSelectedClaim(item)} />}
      />
      <ClaimReviewSheet claim={selectedClaim} onClose={() => setSelectedClaim(null)} />
    </View>
  );
}
