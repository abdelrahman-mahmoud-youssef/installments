import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useI18n } from '@/i18n/i18n-context';
import { currentMonthKey, formatMonthKey, shiftMonthKey } from '@/lib/calendar';
import { useTheme } from '@/theme/theme-context';
import { radius, touchTarget } from '@/theme/tokens';
import { AppText } from './app-text';
import { PressableScale } from './pressable-scale';

type Step = -1 | 1;

interface MonthSwitcherProps {
  month: string;
  onChange: (month: string) => void;
}

export function MonthSwitcher({ month, onChange }: MonthSwitcherProps) {
  const { colors } = useTheme();
  const { t, locale, isRTL } = useI18n();
  const isCurrentMonth = month >= currentMonthKey();

  const renderStepButton = (step: Step) => {
    const isDisabled = step === 1 && isCurrentMonth;
    const pointsBack = (step === -1) !== isRTL;
    return (
      <PressableScale
        onPress={() => onChange(shiftMonthKey(month, step))}
        disabled={isDisabled}
        accessibilityRole="button"
        accessibilityLabel={step === -1 ? t('calendar.previousMonth') : t('calendar.nextMonth')}
        style={{
          width: touchTarget.minHeight,
          height: touchTarget.minHeight,
          alignItems: 'center',
          justifyContent: 'center',
          opacity: isDisabled ? 0.3 : 1,
        }}
      >
        <Ionicons name={pointsBack ? 'chevron-back' : 'chevron-forward'} size={20} color={colors.primary} />
      </PressableScale>
    );
  };

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.surface,
        borderRadius: radius.full,
        borderWidth: 1,
        borderColor: colors.border,
      }}
    >
      {renderStepButton(-1)}
      <PressableScale
        onPress={() => onChange(currentMonthKey())}
        disabled={isCurrentMonth}
        accessibilityRole="button"
        accessibilityHint={t('calendar.backToThisMonth')}
        style={{ flex: 1, alignSelf: 'stretch', alignItems: 'center', justifyContent: 'center', gap: 2 }}
      >
        <AppText variant="bodyStrong">{formatMonthKey(month, locale)}</AppText>
        {!isCurrentMonth ? (
          <AppText variant="label" tone="primary">
            {t('calendar.backToThisMonth')}
          </AppText>
        ) : null}
      </PressableScale>
      {renderStepButton(1)}
    </View>
  );
}
