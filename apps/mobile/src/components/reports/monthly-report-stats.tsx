import { View } from 'react-native';
import { ReportsResponse } from '@/api/reports';
import { StatCard } from '@/components/ui/stat-card';
import { useI18n } from '@/i18n/i18n-context';
import { formatMoney, formatNumber } from '@/lib/format';
import { spacing } from '@/theme/tokens';

interface MonthlyReportStatsProps {
  report: ReportsResponse;
}

export function MonthlyReportStats({ report }: MonthlyReportStatsProps) {
  const { t, locale } = useI18n();
  return (
    <View style={{ flexDirection: 'row', gap: spacing.md }}>
      <StatCard
        icon="cash"
        label={t('reports.monthlyCollections')}
        value={formatMoney(report.monthlyCollections, locale)}
        tone="success"
      />
      <StatCard
        icon="calendar"
        label={t('reports.installmentsThisMonth')}
        value={formatNumber(report.installmentsThisMonth, locale)}
        tone="info"
      />
    </View>
  );
}
