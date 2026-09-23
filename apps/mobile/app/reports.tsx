import { Stack, useRouter } from 'expo-router';
import { useState } from 'react';
import { RefreshControl, ScrollView, View } from 'react-native';
import { CurrentReportStats } from '@/components/reports/current-report-stats';
import { MonthlyReportStats } from '@/components/reports/monthly-report-stats';
import { OverdueCustomersSection } from '@/components/reports/overdue-customers-section';
import { ErrorState } from '@/components/ui/error-state';
import { MonthSwitcher } from '@/components/ui/month-switcher';
import { SkeletonCardList } from '@/components/ui/skeleton';
import { useReports } from '@/hooks/queries';
import { useI18n } from '@/i18n/i18n-context';
import { currentMonthKey } from '@/lib/calendar';
import { useTheme } from '@/theme/theme-context';
import { spacing } from '@/theme/tokens';

export default function ReportsScreen() {
  const { t } = useI18n();
  const { colors } = useTheme();
  const router = useRouter();
  const [month, setMonth] = useState(currentMonthKey());
  const { data, isPending, isError, error, refetch, isRefetching } = useReports(month);

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{ paddingTop: spacing.md, paddingBottom: spacing.xxxl }}
      refreshControl={
        <RefreshControl refreshing={isRefetching} onRefresh={() => void refetch()} tintColor={colors.textMuted} />
      }
    >
      <Stack.Screen options={{ title: t('reports.title') }} />
      <View style={{ paddingHorizontal: spacing.xl, gap: spacing.xl }}>
        <MonthSwitcher month={month} onChange={setMonth} />
        {isPending ? (
          <SkeletonCardList count={4} />
        ) : isError ? (
          <ErrorState error={error} onRetry={() => void refetch()} />
        ) : (
          <>
            <MonthlyReportStats report={data} />
            <CurrentReportStats report={data} />
            <OverdueCustomersSection
              customers={data.overdueCustomers}
              onOpenCustomer={(customerId) => router.push(`/customer/${customerId}`)}
            />
          </>
        )}
      </View>
    </ScrollView>
  );
}
