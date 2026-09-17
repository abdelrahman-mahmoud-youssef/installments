import { Stack } from 'expo-router';
import { ScrollView, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '@/components/ui/app-text';
import { Card } from '@/components/ui/card';
import { PressableScale } from '@/components/ui/pressable-scale';
import { SectionHeader } from '@/components/ui/section-header';
import { useI18n } from '@/i18n/i18n-context';
import { Locale } from '@/i18n/translations';
import { FontScaleOption, ThemeMode, useTheme } from '@/theme/theme-context';
import { spacing, touchTarget } from '@/theme/tokens';

interface Option<T extends string> {
  value: T;
  label: string;
}

function OptionGroup<T extends string>({
  title,
  options,
  selected,
  onSelect,
}: {
  title: string;
  options: Option<T>[];
  selected: T;
  onSelect: (value: T) => void;
}) {
  const { colors } = useTheme();
  return (
    <View style={{ gap: spacing.sm }}>
      <SectionHeader title={title} />
      <Card padded={false}>
        {options.map((option, index) => {
          const isSelected = option.value === selected;
          return (
            <PressableScale
              key={option.value}
              onPress={() => onSelect(option.value)}
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected }}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingHorizontal: spacing.lg,
                minHeight: touchTarget.minHeight + 8,
                borderBottomWidth: index === options.length - 1 ? 0 : 1,
                borderBottomColor: colors.border,
              }}
            >
              <AppText tone={isSelected ? 'primary' : 'default'}>{option.label}</AppText>
              {isSelected ? <Ionicons name="checkmark" size={20} color={colors.primary} /> : null}
            </PressableScale>
          );
        })}
      </Card>
    </View>
  );
}

export default function SettingsScreen() {
  const { t, locale, setLocale } = useI18n();
  const { colors, mode, setMode, fontScaleOption, setFontScaleOption } = useTheme();

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{ padding: spacing.xl, gap: spacing.lg, paddingBottom: spacing.xxxl }}
    >
      <Stack.Screen options={{ title: t('settings.title') }} />
      <OptionGroup<Locale>
        title={t('settings.language')}
        options={[
          { value: 'en', label: t('settings.english') },
          { value: 'ar', label: t('settings.arabic') },
        ]}
        selected={locale}
        onSelect={setLocale}
      />
      <OptionGroup<ThemeMode>
        title={t('settings.appearance')}
        options={[
          { value: 'light', label: t('settings.light') },
          { value: 'dark', label: t('settings.dark') },
          { value: 'system', label: t('settings.system') },
        ]}
        selected={mode}
        onSelect={setMode}
      />
      <OptionGroup<FontScaleOption>
        title={t('settings.fontSize')}
        options={[
          { value: 'small', label: t('settings.fontSmall') },
          { value: 'default', label: t('settings.fontDefault') },
          { value: 'large', label: t('settings.fontLarge') },
          { value: 'extraLarge', label: t('settings.fontExtraLarge') },
        ]}
        selected={fontScaleOption}
        onSelect={setFontScaleOption}
      />
    </ScrollView>
  );
}
