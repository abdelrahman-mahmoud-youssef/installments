import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { useI18n } from '@/i18n/i18n-context';
import { buildMonthWeeks, formatMonthKey, monthKeyOfIsoDate, shiftMonthKey, weekdayInitials } from '@/lib/calendar';
import { todayIsoDate, toLatinDigits } from '@/lib/format';
import { useTheme } from '@/theme/theme-context';
import { radius, spacing, touchTarget } from '@/theme/tokens';
import { AppText } from './app-text';
import { BottomSheet } from './bottom-sheet';
import { PressableScale } from './pressable-scale';

interface CalendarSheetProps {
  visible: boolean;
  title: string;
  value: string;
  maxDate?: string;
  onSelect: (isoDate: string) => void;
  onClose: () => void;
}

export function CalendarSheet({ visible, title, value, maxDate, onSelect, onClose }: CalendarSheetProps) {
  const { t, locale, isRTL } = useI18n();
  const { colors } = useTheme();
  const [monthKey, setMonthKey] = useState(monthKeyOfIsoDate(value));
  const today = todayIsoDate();

  useEffect(() => {
    if (visible) {
      setMonthKey(monthKeyOfIsoDate(value));
    }
  }, [visible, value]);

  const monthButton = (direction: -1 | 1) => (
    <PressableScale
      onPress={() => setMonthKey((current) => shiftMonthKey(current, direction))}
      accessibilityRole="button"
      accessibilityLabel={t(direction === -1 ? 'calendar.previousMonth' : 'calendar.nextMonth')}
      style={{ width: touchTarget.minHeight, height: touchTarget.minHeight, alignItems: 'center', justifyContent: 'center' }}
    >
      <Ionicons
        name={(direction === -1) !== isRTL ? 'chevron-back' : 'chevron-forward'}
        size={20}
        color={colors.primary}
      />
    </PressableScale>
  );

  return (
    <BottomSheet visible={visible} onClose={onClose} title={title} scrollable={false}>
      <View style={{ gap: spacing.md }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          {monthButton(-1)}
          <AppText variant="bodyStrong" align="center" style={{ flex: 1 }}>
            {formatMonthKey(monthKey, locale)}
          </AppText>
          {monthButton(1)}
        </View>
        <View style={{ flexDirection: 'row' }}>
          {weekdayInitials(locale).map((initial, index) => (
            <AppText key={index} variant="label" tone="muted" align="center" style={{ flex: 1 }}>
              {initial}
            </AppText>
          ))}
        </View>
        {buildMonthWeeks(monthKey).map((week, weekIndex) => (
          <View key={weekIndex} style={{ flexDirection: 'row' }}>
            {week.map((isoDate, dayIndex) => {
              if (!isoDate) {
                return <View key={dayIndex} style={{ flex: 1 }} />;
              }
              const isSelected = isoDate === value;
              const isDisabled = maxDate !== undefined && isoDate > maxDate;
              const isToday = isoDate === today;
              return (
                <PressableScale
                  key={isoDate}
                  onPress={() => onSelect(isoDate)}
                  disabled={isDisabled}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isSelected, disabled: isDisabled }}
                  style={{ flex: 1, alignItems: 'center', paddingVertical: spacing.xs, opacity: isDisabled ? 0.3 : 1 }}
                >
                  <View
                    style={{
                      width: touchTarget.minHeight - 6,
                      height: touchTarget.minHeight - 6,
                      borderRadius: radius.full,
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: isSelected ? colors.primary : 'transparent',
                      borderWidth: isToday && !isSelected ? 1.5 : 0,
                      borderColor: colors.primary,
                    }}
                  >
                    <AppText variant="body" tone={isSelected ? 'inverse' : 'default'}>
                      {toLatinDigits(String(Number(isoDate.slice(8, 10))))}
                    </AppText>
                  </View>
                </PressableScale>
              );
            })}
          </View>
        ))}
      </View>
    </BottomSheet>
  );
}
