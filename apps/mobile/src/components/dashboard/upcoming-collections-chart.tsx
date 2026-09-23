import { View } from 'react-native';
import { DashboardInstallmentSummary } from '@/api/dashboard';
import { AppText } from '@/components/ui/app-text';
import { Card } from '@/components/ui/card';
import { MoneyText } from '@/components/ui/money-text';
import { SectionHeader } from '@/components/ui/section-header';
import { useI18n } from '@/i18n/i18n-context';
import { formatShortWeekday, shiftIsoDate } from '@/lib/calendar';
import { formatMoney, todayIsoDate } from '@/lib/format';
import { buildDailyCollections, DailyCollection } from '@/lib/upcoming-collections';
import { useTheme } from '@/theme/theme-context';
import { radius, spacing } from '@/theme/tokens';

const UPCOMING_DAY_COUNT = 7;
const CHART_HEIGHT = 96;
const MIN_VISIBLE_BAR_HEIGHT = 4;
const EMPTY_BAR_HEIGHT = 2;
const BAR_WIDTH_RATIO = '60%';

interface UpcomingCollectionsChartProps {
  installments: DashboardInstallmentSummary[];
}

export function UpcomingCollectionsChart({ installments }: UpcomingCollectionsChartProps) {
  const { t } = useI18n();
  const days = buildDailyCollections(installments, shiftIsoDate(todayIsoDate(), 1), UPCOMING_DAY_COUNT);
  const highestAmount = Math.max(...days.map((day) => day.amount));
  const weekTotal = days.reduce((total, day) => total + day.amount, 0);

  return (
    <View style={{ gap: spacing.md }}>
      <SectionHeader title={t('dashboard.upcomingCollections')} />
      <Card>
        {highestAmount === 0 ? (
          <AppText variant="caption" tone="muted">
            {t('dashboard.emptyUpcoming')}
          </AppText>
        ) : (
          <View style={{ gap: spacing.md }}>
            <View style={{ gap: 2 }}>
              <AppText variant="label" tone="muted">
                {t('dashboard.upcomingTotal')}
              </AppText>
              <MoneyText minorUnits={weekTotal} variant="heading" />
            </View>
            <View style={{ flexDirection: 'row', gap: spacing.xs }}>
              {days.map((day) => (
                <DayBar key={day.date} day={day} highestAmount={highestAmount} />
              ))}
            </View>
          </View>
        )}
      </Card>
    </View>
  );
}

interface DayBarProps {
  day: DailyCollection;
  highestAmount: number;
}

function DayBar({ day, highestAmount }: DayBarProps) {
  const { locale } = useI18n();
  const { colors } = useTheme();
  const weekday = formatShortWeekday(day.date, locale);
  const barHeight =
    day.amount === 0
      ? EMPTY_BAR_HEIGHT
      : Math.max(MIN_VISIBLE_BAR_HEIGHT, (day.amount / highestAmount) * CHART_HEIGHT);

  return (
    <View
      accessible
      accessibilityLabel={`${weekday}: ${formatMoney(day.amount, locale)}`}
      style={{ flex: 1, alignItems: 'center', gap: spacing.xs }}
    >
      <View style={{ height: CHART_HEIGHT, width: '100%', alignItems: 'center', justifyContent: 'flex-end' }}>
        <View
          style={{
            width: BAR_WIDTH_RATIO,
            height: barHeight,
            borderRadius: radius.sm,
            backgroundColor: day.amount === 0 ? colors.border : colors.primary,
          }}
        />
      </View>
      <AppText variant="label" tone="muted" numberOfLines={1}>
        {weekday}
      </AppText>
    </View>
  );
}
