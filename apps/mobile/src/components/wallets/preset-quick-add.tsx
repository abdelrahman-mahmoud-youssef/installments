import { ScrollView, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '@/components/ui/app-text';
import { PressableScale } from '@/components/ui/pressable-scale';
import { useI18n } from '@/i18n/i18n-context';
import { PAYMENT_METHOD_PRESETS } from '@/lib/payment-method-presets';
import { useTheme } from '@/theme/theme-context';
import { radius, spacing } from '@/theme/tokens';

const PRESET_ICON_SIZE = 44;

interface PresetQuickAddProps {
  onSelect: (presetKey: string) => void;
}

export function PresetQuickAdd({ onSelect }: PresetQuickAddProps) {
  const { colors } = useTheme();
  const { t } = useI18n();

  return (
    <View style={{ gap: spacing.sm }}>
      <AppText variant="caption" tone="muted" style={{ paddingHorizontal: spacing.xl }}>
        {t('wallets.quickAdd')}
      </AppText>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: spacing.md, paddingHorizontal: spacing.xl }}
      >
        {PAYMENT_METHOD_PRESETS.map((preset) => (
          <PressableScale
            key={preset.key}
            onPress={() => onSelect(preset.key)}
            accessibilityRole="button"
            accessibilityLabel={`${t('wallets.addMethod')}: ${preset.label}`}
            style={{ alignItems: 'center', gap: spacing.xs, width: PRESET_ICON_SIZE + spacing.xxl }}
          >
            <View
              style={{
                width: PRESET_ICON_SIZE,
                height: PRESET_ICON_SIZE,
                borderRadius: radius.full,
                backgroundColor: `${preset.color}1f`,
                borderWidth: 1,
                borderColor: `${preset.color}33`,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons name={preset.icon} size={20} color={preset.color} />
              <View
                style={{
                  position: 'absolute',
                  bottom: -2,
                  end: -2,
                  width: 18,
                  height: 18,
                  borderRadius: radius.full,
                  backgroundColor: colors.primary,
                  borderWidth: 2,
                  borderColor: colors.background,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons name="add" size={11} color={colors.onPrimary} />
              </View>
            </View>
            <AppText variant="label" tone="muted" numberOfLines={1} align="center">
              {preset.label}
            </AppText>
          </PressableScale>
        ))}
      </ScrollView>
    </View>
  );
}
