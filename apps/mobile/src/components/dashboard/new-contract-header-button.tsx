import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { PressableScale } from '@/components/ui/pressable-scale';
import { useI18n } from '@/i18n/i18n-context';
import { useTheme } from '@/theme/theme-context';
import { spacing } from '@/theme/tokens';

export function NewContractHeaderButton() {
  const { t } = useI18n();
  const { colors } = useTheme();
  const router = useRouter();

  return (
    <PressableScale
      onPress={() => router.push('/contract/new')}
      accessibilityRole="button"
      accessibilityLabel={t('dashboard.newContract')}
      hitSlop={spacing.sm}
    >
      <Ionicons name="add-circle" size={28} color={colors.primary} />
    </PressableScale>
  );
}
