import { useState } from 'react';
import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '@/components/ui/app-text';
import { PressableScale } from '@/components/ui/pressable-scale';
import { useI18n } from '@/i18n/i18n-context';
import { isolateLtr, maskAccountDetails } from '@/lib/format';
import { useTheme } from '@/theme/theme-context';
import { spacing } from '@/theme/tokens';

interface MaskedAccountDetailsProps {
  details: string;
}

export function MaskedAccountDetails({ details }: MaskedAccountDetailsProps) {
  const { colors } = useTheme();
  const { t } = useI18n();
  const [isVisible, setIsVisible] = useState(false);

  return (
    <PressableScale
      onPress={() => setIsVisible((visible) => !visible)}
      accessibilityRole="button"
      accessibilityLabel={isVisible ? t('wallets.hideDetails') : t('wallets.showDetails')}
      hitSlop={8}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
        <AppText variant="caption" tone="muted">
          {isolateLtr(isVisible ? details : maskAccountDetails(details))}
        </AppText>
        <Ionicons name={isVisible ? 'eye-off-outline' : 'eye-outline'} size={14} color={colors.textFaint} />
      </View>
    </PressableScale>
  );
}
