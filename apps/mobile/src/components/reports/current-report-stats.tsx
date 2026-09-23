import { View } from 'react-native';
import { ReportsResponse } from '@/api/reports';
import { SectionHeader } from '@/components/ui/section-header';
import { StatCard } from '@/components/ui/stat-card';
import { useI18n } from '@/i18n/i18n-context';
import { formatMoney, formatNumber } from '@/lib/format';
import { spacing } from '@/theme/tokens';

interface CurrentReportStatsProps {
  report: ReportsResponse;
}

export function CurrentReportStats({ report }: CurrentReportStatsProps) {
  const { t, locale } = useI18n();
  return (
    <View style={{ gap: spacing.md }}>
      <SectionHeader title={t('reports.todaySection')} />
      <View style={{ flexDirection: 'row', gap: spacing.md }}>
        <StatCard
          icon="today"
          label={t('reports.todayCollections')}
          value={formatMoney(report.todayCollections, locale)}
          tone="primary"
        />
        <StatCard
          icon="alert-circle"
          label={t('reports.overdueBalance')}
          value={formatMoney(report.overdueBalance, locale)}
          tone="danger"
        />
      </View>
      <SectionHeader title={t('reports.portfolioSection')} />
      <View style={{ flexDirection: 'row', gap: spacing.md }}>
        <StatCard
          icon="document-text"
          label={t('reports.totalContracts')}
          value={formatNumber(report.totalContracts, locale)}
          tone="neutral"
        />
        <StatCard
          icon="pulse"
          label={t('reports.activeContracts')}
          value={formatNumber(report.activeContracts, locale)}
          tone="primary"
        />
        <StatCard
          icon="people"
          label={t('reports.totalCustomers')}
          value={formatNumber(report.totalCustomers, locale)}
          tone="info"
        />
      </View>
    </View>
  );
}
