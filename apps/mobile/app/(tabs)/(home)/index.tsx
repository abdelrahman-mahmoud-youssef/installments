import { Stack, useRouter } from 'expo-router';
import { RefreshControl, ScrollView, View } from 'react-native';
import { useAuth } from '@/auth/auth-context';
import { DashboardSummaryStats } from '@/components/dashboard/dashboard-summary-stats';
import { InstallmentSection } from '@/components/dashboard/installment-section';
import { NewContractHeaderButton } from '@/components/dashboard/new-contract-header-button';
import { PendingClaimsCard } from '@/components/dashboard/pending-claims-card';
import { RecentPaymentsSection } from '@/components/dashboard/recent-payments-section';
import { UpcomingCollectionsChart } from '@/components/dashboard/upcoming-collections-chart';
import { AppText } from '@/components/ui/app-text';
import { ErrorState } from '@/components/ui/error-state';
import { SkeletonCardList } from '@/components/ui/skeleton';
import { useDashboard } from '@/hooks/queries';
import { useI18n } from '@/i18n/i18n-context';
import { useTheme } from '@/theme/theme-context';
import { spacing } from '@/theme/tokens';

export default function DashboardScreen() {
  const { user } = useAuth();
  const { t } = useI18n();
  const { colors } = useTheme();
  const router = useRouter();
  const { data, isPending, isError, error, refetch, isRefetching } = useDashboard();

  const openContract = (contractId: string) => router.push(`/contract/${contractId}`);

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{ paddingTop: spacing.md, paddingBottom: spacing.xxxl }}
      refreshControl={
        <RefreshControl refreshing={isRefetching} onRefresh={() => void refetch()} tintColor={colors.textMuted} />
      }
    >
      <Stack.Screen options={{ title: t('dashboard.title'), headerRight: () => <NewContractHeaderButton /> }} />
      <View style={{ paddingHorizontal: spacing.xl, gap: spacing.xl }}>
        {user ? (
          <AppText variant="caption" tone="muted">
            {t('dashboard.greeting', { name: user.name })}
          </AppText>
        ) : null}
        {isPending ? (
          <SkeletonCardList count={4} />
        ) : isError ? (
          <ErrorState error={error} onRetry={() => void refetch()} />
        ) : (
          <>
            <DashboardSummaryStats dashboard={data} />
            {data.pendingPaymentClaims > 0 ? (
              <PendingClaimsCard count={data.pendingPaymentClaims} onPress={() => router.push('/payment-claims')} />
            ) : null}
            <UpcomingCollectionsChart installments={data.dueNext7Days} />
            <InstallmentSection
              title={t('dashboard.overdue')}
              installments={data.overdue}
              emptyMessage={t('dashboard.emptyOverdue')}
              showDueDate
              onOpenContract={openContract}
            />
            <InstallmentSection
              title={t('dashboard.dueToday')}
              installments={data.dueToday}
              emptyMessage={t('dashboard.emptyDueToday')}
              showDueDate={false}
              onOpenContract={openContract}
            />
            <InstallmentSection
              title={t('dashboard.upcoming')}
              installments={data.dueNext7Days}
              emptyMessage={t('dashboard.emptyUpcoming')}
              showDueDate
              onOpenContract={openContract}
            />
            <RecentPaymentsSection payments={data.recentPayments} onOpenContract={openContract} />
          </>
        )}
      </View>
    </ScrollView>
  );
}
