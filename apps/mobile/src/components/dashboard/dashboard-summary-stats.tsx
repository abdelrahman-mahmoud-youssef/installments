import { View } from 'react-native';
import { DashboardResponse } from '@/api/dashboard';
import { StatCard } from '@/components/ui/stat-card';
import { useI18n } from '@/i18n/i18n-context';
import { formatMoney, formatNumber } from '@/lib/format';
import { spacing } from '@/theme/tokens';

interface DashboardSummaryStatsProps {
  dashboard: DashboardResponse;
}

export function DashboardSummaryStats({ dashboard }: DashboardSummaryStatsProps) {
  const { t, locale } = useI18n();
  return (
    <View style={{ gap: spacing.md }}>
      <View style={{ flexDirection: 'row', gap: spacing.md }}>
        <StatCard
          icon="trending-up"
          label={t('dashboard.expectedToday')}
          value={formatMoney(dashboard.totalExpectedToday, locale)}
        />
        <StatCard
          icon="alert-circle"
          label={t('dashboard.overdueBalance')}
          value={formatMoney(dashboard.overdueBalance, locale)}
          tone="danger"
        />
      </View>
      <View style={{ flexDirection: 'row', gap: spacing.md }}>
        <StatCard
          icon="people"
          label={t('dashboard.customers')}
          value={formatNumber(dashboard.totalCustomers, locale)}
          tone="info"
        />
        <StatCard
          icon="document-text"
          label={t('dashboard.activeContracts')}
          value={formatNumber(dashboard.activeContracts, locale)}
          tone="info"
        />
      </View>
      <View style={{ flexDirection: 'row', gap: spacing.md }}>
        <StatCard
          icon="today"
          label={t('dashboard.dueToday')}
          value={formatNumber(dashboard.dueToday.length, locale)}
          tone="warning"
        />
        <StatCard
          icon="time"
          label={t('dashboard.overdue')}
          value={formatNumber(dashboard.overdue.length, locale)}
          tone="danger"
        />
        <StatCard
          icon="calendar"
          label={t('dashboard.upcoming')}
          value={formatNumber(dashboard.dueNext7Days.length, locale)}
          tone="neutral"
        />
      </View>
    </View>
  );
}
