import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useI18n } from '@/i18n/i18n-context';
import { shiftIsoDate } from '@/lib/calendar';
import { formatDate, todayIsoDate } from '@/lib/format';
import { useTheme } from '@/theme/theme-context';
import { radius, spacing, touchTarget } from '@/theme/tokens';
import { AppText } from './app-text';
import { PressableScale } from './pressable-scale';

type Step = -1 | 1;

interface DateStepperProps {
  label: string;
  value: string;
  onChange: (isoDate: string) => void;
}

export function DateStepper({ label, value, onChange }: DateStepperProps) {
  const { colors } = useTheme();
  const { t, locale, isRTL } = useI18n();
  const isToday = value >= todayIsoDate();

  const renderStepButton = (step: Step) => {
    const isDisabled = step === 1 && isToday;
    const pointsBack = (step === -1) !== isRTL;
    return (
      <PressableScale
        onPress={() => onChange(shiftIsoDate(value, step))}
        disabled={isDisabled}
        accessibilityRole="button"
        accessibilityLabel={step === -1 ? t('calendar.previousDay') : t('calendar.nextDay')}
        style={{
          width: touchTarget.minHeight,
          height: touchTarget.minHeight,
          alignItems: 'center',
          justifyContent: 'center',
          opacity: isDisabled ? 0.3 : 1,
        }}
      >
        <Ionicons name={pointsBack ? 'chevron-back' : 'chevron-forward'} size={18} color={colors.primary} />
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
        {renderStepButton(-1)}
        <View style={{ flex: 1, alignItems: 'center' }}>
          <AppText variant="body">{isToday ? t('calendar.today') : formatDate(value, locale)}</AppText>
        </View>
        {renderStepButton(1)}
      </View>
    </View>
  );
}
