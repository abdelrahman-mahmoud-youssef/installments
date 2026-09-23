import { ReactNode } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { spacing } from '@/theme/tokens';

interface FloatingActionBarProps {
  children: ReactNode;
}

export function FloatingActionBar({ children }: FloatingActionBarProps) {
  return (
    <SafeAreaView
      edges={['bottom']}
      pointerEvents="box-none"
      style={{
        position: 'absolute',
        left: spacing.xl,
        right: spacing.xl,
        bottom: spacing.lg,
      }}
    >
      {children}
    </SafeAreaView>
  );
}
