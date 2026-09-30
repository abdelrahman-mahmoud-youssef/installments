import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '@/components/ui/app-text';
import { PressableScale } from '@/components/ui/pressable-scale';
import { SectionHeader } from '@/components/ui/section-header';
import { selectionHaptic } from '@/lib/haptics';
import { useTheme } from '@/theme/theme-context';
import { fontSizes, radius, spacing } from '@/theme/tokens';

type TileVisual = { icon: keyof typeof Ionicons.glyphMap } | { glyph: string; glyphScale?: number };

export interface OptionTile<T extends string> {
  value: T;
  label: string;
  visual: TileVisual;
}

interface OptionTilesProps<T extends string> {
  title: string;
  options: OptionTile<T>[];
  selected: T;
  onSelect: (value: T) => void;
}

const TILE_MIN_HEIGHT = 92;
const ICON_SIZE = 26;

function TileVisualView({ visual, color }: { visual: TileVisual; color: string }) {
  if ('icon' in visual) {
    return <Ionicons name={visual.icon} size={ICON_SIZE} color={color} />;
  }
  return (
    <AppText
      style={{ color, fontWeight: '700', fontSize: fontSizes.xl * (visual.glyphScale ?? 1), lineHeight: ICON_SIZE + 6 }}
    >
      {visual.glyph}
    </AppText>
  );
}

export function OptionTiles<T extends string>({ title, options, selected, onSelect }: OptionTilesProps<T>) {
  const { colors } = useTheme();
  return (
    <View style={{ gap: spacing.sm }}>
      <SectionHeader title={title} />
      <View style={{ flexDirection: 'row', gap: spacing.sm }}>
        {options.map((option) => {
          const isSelected = option.value === selected;
          const foreground = isSelected ? colors.primary : colors.textMuted;
          return (
            <PressableScale
              key={option.value}
              onPress={() => {
                selectionHaptic();
                onSelect(option.value);
              }}
              accessibilityRole="button"
              accessibilityLabel={option.label}
              accessibilityState={{ selected: isSelected }}
              style={{
                flex: 1,
                minHeight: TILE_MIN_HEIGHT,
                borderRadius: radius.lg,
                borderWidth: 1.5,
                borderColor: isSelected ? colors.primary : colors.border,
                backgroundColor: isSelected ? colors.primaryMuted : colors.surface,
                alignItems: 'center',
                justifyContent: 'center',
                gap: spacing.sm,
                paddingHorizontal: spacing.xs,
                paddingVertical: spacing.md,
              }}
            >
              <View style={{ height: ICON_SIZE + 6, alignItems: 'center', justifyContent: 'center' }}>
                <TileVisualView visual={option.visual} color={foreground} />
              </View>
              <AppText
                variant="label"
                numberOfLines={1}
                adjustsFontSizeToFit
                align="center"
                style={{ color: foreground }}
              >
                {option.label}
              </AppText>
            </PressableScale>
          );
        })}
      </View>
    </View>
  );
}
