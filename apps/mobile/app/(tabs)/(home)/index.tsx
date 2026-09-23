import { Stack, useRouter } from 'expo-router';
import { RefreshControl, ScrollView, View } from 'react-native';
import { DashboardInstallmentSummary } from '@/api/dashboard';
import { useAuth } from '@/auth/auth-context';
import { InstallmentRow } from '@/components/dashboard/installment-row';
import { PendingClaimsCard } from '@/components/dashboard/pending-claims-card';
import { AppText } from '@/components/ui/app-text';
import { Card } from '@/components/ui/card';
import { ErrorState } from '@/components/ui/error-state';
import { MoneyText } from '@/components/ui/money-text';
import { SectionHeader } from '@/components/ui/section-header';
import { SkeletonCardList } from '@/components/ui/skeleton';
import { StatCard } from '@/components/ui/stat-card';
import { useDashboard } from '@/hooks/queries';
import { useI18n } from '@/i18n/i18n-context';
import { formatDateTime, formatMoney, formatNumber } from '@/lib/format';
import { useTheme } from '@/theme/theme-context';
import { spacing } from '@/theme/tokens';

export default function DashboardScreen() {
  const { user } = useAuth();
  const { t, locale } = useI18n();
  const { colors } = useTheme();
  const router = useRouter();
  const { data, isPending, isError, error, refetch, isRefetching } = useDashboard();

  const openContract = (contractId: string) => router.push(`/contract/${contractId}`);

  const renderInstallmentSection = (
    title: string,
    installments: DashboardInstallmentSummary[],
    emptyMessage: string,
    showDueDate: boolean,
  ) => (
    <View style={{ gap: spacing.md }}>
      <SectionHeader title={title} />
      <Card>
        {installments.length === 0 ? (
          <AppText variant="caption" tone="muted">
            {emptyMessage}
          </AppText>
        ) : (
          installments.map((installment, index) => (
            <InstallmentRow
              key={installment.id}
              installment={installment}
              onPress={() => openContract(installment.contractId)}
              showDueDate={showDueDate}
              isLast={index === installments.length - 1}
            />
          ))
        )}
      </Card>
    </View>
  );

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{ paddingTop: spacing.md, paddingBottom: spacing.xxxl }}
      refreshControl={
        <RefreshControl refreshing={isRefetching} onRefresh={() => void refetch()} tintColor={colors.textMuted} />
      }
    >
      <Stack.Screen options={{ title: t('dashboard.title') }} />
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
        ) : data ? (
          <>
            <View style={{ gap: spacing.md }}>
              <View style={{ flexDirection: 'row', gap: spacing.md }}>
                <StatCard
                  icon="trending-up"
                  label={t('dashboard.expectedToday')}
                  value={formatMoney(data.totalExpectedToday, locale)}
                />
                <StatCard
                  icon="alert-circle"
                  label={t('dashboard.overdueBalance')}
                  value={formatMoney(data.overdueBalance, locale)}
                  tone="danger"
                />
              </View>
              <View style={{ flexDirection: 'row', gap: spacing.md }}>
                <StatCard
                  icon="people"
                  label={t('dashboard.customers')}
                  value={formatNumber(data.totalCustomers, locale)}
                  tone="info"
                />
                <StatCard
                  icon="document-text"
                  label={t('dashboard.activeContracts')}
                  value={formatNumber(data.activeContracts, locale)}
                  tone="info"
                />
              </View>
            </View>

            {data.pendingPaymentClaims > 0 ? (
              <PendingClaimsCard count={data.pendingPaymentClaims} onPress={() => router.push('/payment-claims')} />
            ) : null}

            {renderInstallmentSection(
              t('dashboard.overdue'),
              data.overdue,
              t('dashboard.emptyOverdue'),
              true,
            )}
            {renderInstallmentSection(
              t('dashboard.dueToday'),
              data.dueToday,
              t('dashboard.emptyDueToday'),
              false,
            )}
            {renderInstallmentSection(
              t('dashboard.upcoming'),
              data.dueNext7Days,
              t('dashboard.emptyUpcoming'),
              true,
            )}

            <View style={{ gap: spacing.md }}>
              <SectionHeader title={t('dashboard.recentPayments')} />
              <Card>
                {data.recentPayments.length === 0 ? (
                  <AppText variant="caption" tone="muted">
                    {t('dashboard.emptyPayments')}
                  </AppText>
                ) : (
                  data.recentPayments.map((payment, index) => (
                    <View
                      key={payment.id}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: spacing.md,
                        paddingVertical: spacing.md,
                        borderBottomWidth: index === data.recentPayments.length - 1 ? 0 : 1,
                        borderBottomColor: colors.border,
                      }}
                    >
                      <View style={{ flex: 1, gap: 2 }}>
                        <AppText variant="bodyStrong" numberOfLines={1}>
                          {payment.customerName}
                        </AppText>
                        <AppText variant="label" tone="faint">
                          {formatDateTime(payment.paidAt, locale)}
                        </AppText>
                      </View>
                      <MoneyText minorUnits={payment.amount} variant="bodyStrong" tone="success" />
                    </View>
                  ))
                )}
              </Card>
            </View>
          </>
        ) : null}
      </View>
    </ScrollView>
  );
}
