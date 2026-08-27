import { View } from 'react-native';
import { spacing } from '@/theme/tokens';
import { AppText } from './app-text';
import { PressableScale } from './pressable-scale';

interface SectionHeaderProps {
  title: string;
  actionTitle?: string;
  onAction?: () => void;
}

export function SectionHeader({ title, actionTitle, onAction }: SectionHeaderProps) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: spacing.sm,
      }}
    >
      <AppText variant="heading">{title}</AppText>
      {actionTitle && onAction ? (
        <PressableScale onPress={onAction} accessibilityRole="button" hitSlop={8}>
          <AppText variant="caption" tone="primary">
            {actionTitle}
          </AppText>
        </PressableScale>
      ) : null}
    </View>
  );
}
