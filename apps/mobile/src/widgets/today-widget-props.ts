import type { DashboardResponse } from '@/api/dashboard';
import type { Locale } from '@/i18n/translations';
import { BRAND_COLOR_HEX, BrandColorPreset } from '@/lib/brand-colors';
import { formatMoney, formatNumber } from '@/lib/format';
import { remainingOf } from '@/lib/installment-balance';
import { darkColors, lightColors } from '@/theme/tokens';

export const TODAY_WIDGET_MAX_ROWS = 7;

export interface TodayWidgetRow {
  name: string;
  amount: string;
}

export interface TodayWidgetProps {
  isRTL: boolean;
  signedIn: boolean;
  accentColor: string;
  surfaceLight: string;
  surfaceDark: string;
  mutedLight: string;
  mutedDark: string;
  title: string;
  signedOutLabel: string;
  emptyLabel: string;
  claimsLabel: string;
  dueCount: string;
  dueTotal: string;
  claimsCount: string;
  inlineSummary: string;
  rows: TodayWidgetRow[];
  hiddenRowsLabels: string[];
}

interface TodayWidgetContext {
  t: (key: string, params?: Record<string, string | number>) => string;
  locale: Locale;
  isRTL: boolean;
  brandColor: BrandColorPreset | null;
}

const DEFAULT_ACCENT = lightColors.primary;

function hiddenRowsLabels(totalRows: number, t: TodayWidgetContext['t'], locale: Locale): string[] {
  return Array.from({ length: TODAY_WIDGET_MAX_ROWS + 1 }, (_, visibleRows) => {
    const hidden = totalRows - visibleRows;
    return hidden > 0 ? t('widget.more', { count: formatNumber(hidden, locale) }) : '';
  });
}

export function buildTodayWidgetProps(
  dashboard: DashboardResponse | null,
  { t, locale, isRTL, brandColor }: TodayWidgetContext,
): TodayWidgetProps {
  const dueToday = dashboard?.dueToday ?? [];
  const dueCount = formatNumber(dueToday.length, locale);
  const claimsCount = formatNumber(dashboard?.pendingPaymentClaims ?? 0, locale);

  return {
    isRTL,
    signedIn: dashboard !== null,
    accentColor: brandColor ? BRAND_COLOR_HEX[brandColor] : DEFAULT_ACCENT,
    surfaceLight: lightColors.surface,
    surfaceDark: darkColors.surface,
    mutedLight: lightColors.textMuted,
    mutedDark: darkColors.textMuted,
    title: t('widget.dueToday'),
    signedOutLabel: t('widget.signedOut'),
    emptyLabel: t('widget.nothingDue'),
    claimsLabel: t('widget.pendingClaims'),
    dueCount,
    dueTotal: formatMoney(dashboard?.totalExpectedToday ?? 0, locale),
    claimsCount,
    inlineSummary: t('widget.inline', { due: dueCount, claims: claimsCount }),
    rows: dueToday.slice(0, TODAY_WIDGET_MAX_ROWS).map((installment) => ({
      name: installment.customerName,
      amount: formatMoney(remainingOf(installment), locale),
    })),
    hiddenRowsLabels: hiddenRowsLabels(dueToday.length, t, locale),
  };
}
