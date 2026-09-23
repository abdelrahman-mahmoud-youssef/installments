import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useI18n } from '@/i18n/i18n-context';
import { shiftIsoDate, shiftIsoDateByMonths } from '@/lib/calendar';
import { formatDate, todayIsoDate } from '@/lib/format';
import { useTheme } from '@/theme/theme-context';
import { radius, spacing, touchTarget } from '@/theme/tokens';
import { AppText } from './app-text';
import { PressableScale } from './pressable-scale';

type Direction = -1 | 1;
type StepUnit = 'day' | 'month';

interface DateStepperProps {
  label: string;
  value: string;
  onChange: (isoDate: string) => void;
  maxDate?: string;
  showMonthSteps?: boolean;
}

const STEP_ICONS: Record<StepUnit, { back: keyof typeof Ionicons.glyphMap; forward: keyof typeof Ionicons.glyphMap }> = {
  day: { back: 'chevron-back', forward: 'chevron-forward' },
  month: { back: 'play-back', forward: 'play-forward' },
};

const STEP_LABELS: Record<StepUnit, { back: string; forward: string }> = {
  day: { back: 'calendar.previousDay', forward: 'calendar.nextDay' },
  month: { back: 'calendar.previousMonth', forward: 'calendar.nextMonth' },
};

export function DateStepper({ label, value, onChange, maxDate, showMonthSteps = false }: DateStepperProps) {
  const { colors } = useTheme();
  const { t, locale, isRTL } = useI18n();
  const isToday = value === todayIsoDate();

  const shift = (unit: StepUnit, direction: Direction) =>
    unit === 'day' ? shiftIsoDate(value, direction) : shiftIsoDateByMonths(value, direction);

  const renderStepButton = (unit: StepUnit, direction: Direction) => {
    const next = shift(unit, direction);
    const isDisabled = direction === 1 && maxDate !== undefined && next > maxDate;
    const pointsBack = (direction === -1) !== isRTL;
    const icons = STEP_ICONS[unit];
    const labels = STEP_LABELS[unit];
    return (
      <PressableScale
        onPress={() => onChange(next)}
        disabled={isDisabled}
        accessibilityRole="button"
        accessibilityLabel={t(direction === -1 ? labels.back : labels.forward)}
        style={{
          width: touchTarget.minHeight,
          height: touchTarget.minHeight,
          alignItems: 'center',
          justifyContent: 'center',
          opacity: isDisabled ? 0.3 : 1,
        }}
      >
        <Ionicons name={pointsBack ? icons.back : icons.forward} size={unit === 'day' ? 18 : 14} color={colors.primary} />
      </PressableScale>
    );
  };

  return (
    <View style={{ gap: spacing.xs }}>
      <AppText variant="caption" tone="muted">
        {label}
      </AppText>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          borderWidth: 1.5,
          borderColor: colors.border,
          borderRadius: radius.md,
          backgroundColor: colors.surface,
          minHeight: touchTarget.minHeight + 4,
        }}
      >
        {showMonthSteps ? renderStepButton('month', -1) : null}
        {renderStepButton('day', -1)}
        <View style={{ flex: 1, alignItems: 'center' }}>
          <AppText variant="body">{isToday ? t('calendar.today') : formatDate(value, locale)}</AppText>
        </View>
        {renderStepButton('day', 1)}
        {showMonthSteps ? renderStepButton('month', 1) : null}
      </View>
    </View>
  );
}
