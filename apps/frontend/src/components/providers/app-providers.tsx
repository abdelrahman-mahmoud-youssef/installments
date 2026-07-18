'use client';

import { DirectionProvider } from '@base-ui/react/direction-provider';
import { MotionConfig } from 'framer-motion';
import { ThemeProvider } from '@/lib/theme';
import { QueryProvider } from './query-provider';

export function AppProviders({
  direction,
  children,
}: {
  direction: 'rtl' | 'ltr';
  children: React.ReactNode;
}) {
  return (
    <ThemeProvider>
      <DirectionProvider direction={direction}>
        <MotionConfig reducedMotion="user">
          <QueryProvider>{children}</QueryProvider>
        </MotionConfig>
      </DirectionProvider>
    </ThemeProvider>
  );
}
