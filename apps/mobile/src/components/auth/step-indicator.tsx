import { View } from 'react-native';
import { AppText } from '@/components/ui/app-text';
import { useTheme } from '@/theme/theme-context';
import { radius, spacing } from '@/theme/tokens';

interface StepIndicatorProps {
  totalSteps: number;
  currentStep: number;
  label: string;
}

const BAR_HEIGHT = 5;

export function StepIndicator({ totalSteps, currentStep, label }: StepIndicatorProps) {
  const { colors } = useTheme();
  return (
    <View style={{ gap: spacing.sm }} accessibilityRole="progressbar" accessibilityLabel={label}>
      <View style={{ flexDirection: 'row', gap: spacing.sm }}>
        {Array.from({ length: totalSteps }, (_, index) => (
          <View
            key={index}
            style={{
              flex: 1,
              height: BAR_HEIGHT,
              borderRadius: radius.full,
              backgroundColor: index <= currentStep ? colors.primary : colors.border,
            }}
          />
        ))}
      </View>
      <AppText variant="label" tone="muted">
        {label}
      </AppText>
    </View>
  );
}
