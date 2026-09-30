import { Stack } from 'expo-router';
import { ScrollView } from 'react-native';
import { OptionTiles } from '@/components/settings/option-tiles';
import { ARABIC_FONT_OPTIONS, ArabicFontOption } from '@/theme/arabic-fonts';
import { useI18n } from '@/i18n/i18n-context';
import { Locale } from '@/i18n/translations';
import { FontScaleOption, ThemeMode, useTheme } from '@/theme/theme-context';
import { spacing } from '@/theme/tokens';

export default function SettingsScreen() {
  const { t, locale, setLocale } = useI18n();
  const { colors, mode, setMode, fontScaleOption, setFontScaleOption, arabicFont, setArabicFont, arabicFontPreview } =
    useTheme();

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{ padding: spacing.xl, gap: spacing.xl, paddingBottom: spacing.xxxl }}
    >
      <Stack.Screen options={{ title: t('settings.title') }} />
      <OptionTiles<Locale>
        title={t('settings.language')}
        options={[
          { value: 'en', label: t('settings.english'), visual: { glyph: 'Aa' } },
          { value: 'ar', label: t('settings.arabic'), visual: { glyph: 'أب' } },
        ]}
        selected={locale}
        onSelect={setLocale}
      />
      <OptionTiles<ThemeMode>
        title={t('settings.appearance')}
        options={[
          { value: 'light', label: t('settings.light'), visual: { icon: 'sunny-outline' } },
          { value: 'dark', label: t('settings.dark'), visual: { icon: 'moon-outline' } },
          { value: 'system', label: t('settings.system'), visual: { icon: 'phone-portrait-outline' } },
        ]}
        selected={mode}
        onSelect={setMode}
      />
      <OptionTiles<FontScaleOption>
        title={t('settings.fontSize')}
        options={[
          { value: 'small', label: t('settings.fontSmall'), visual: { glyph: 'A', glyphScale: 0.8 } },
          { value: 'default', label: t('settings.fontDefault'), visual: { glyph: 'A' } },
          { value: 'large', label: t('settings.fontLarge'), visual: { glyph: 'A', glyphScale: 1.2 } },
          { value: 'extraLarge', label: t('settings.fontExtraLarge'), visual: { glyph: 'A', glyphScale: 1.45 } },
        ]}
        selected={fontScaleOption}
        onSelect={setFontScaleOption}
      />
      <OptionTiles<ArabicFontOption>
        title={t('settings.arabicFont')}
        options={ARABIC_FONT_OPTIONS.map((option) => ({
          value: option,
          label: t(`settings.arabicFonts.${option}`),
          visual: { glyph: 'أب', fontFamily: arabicFontPreview(option) },
        }))}
        selected={arabicFont}
        onSelect={setArabicFont}
      />
    </ScrollView>
  );
}
