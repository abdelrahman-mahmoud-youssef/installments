import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '@/components/ui/app-text';
import { useTheme } from '@/theme/theme-context';
import { radius, spacing } from '@/theme/tokens';

interface AuthIntroProps {
  title: string;
  subtitle: string;
}

const MARK_SIZE = 72;

export function AuthIntro({ title, subtitle }: AuthIntroProps) {
  const { colors } = useTheme();
  return (
    <View style={{ alignItems: 'center', gap: spacing.md }}>
      <View
        style={{
          width: MARK_SIZE,
          height: MARK_SIZE,
          borderRadius: radius.xl,
          backgroundColor: colors.primaryMuted,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Ionicons name="wallet" size={34} color={colors.primary} />
      </View>
      <AppText variant="largeTitle" align="center">
        {title}
      </AppText>
      <AppText variant="caption" tone="muted" align="center">
        {subtitle}
      </AppText>
    </View>
  );
}
