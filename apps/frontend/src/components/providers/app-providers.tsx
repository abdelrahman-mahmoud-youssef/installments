'use client';

import { DirectionProvider } from '@base-ui/react/direction-provider';
import { MotionConfig } from 'framer-motion';
import { ThemeProvider } from 'next-themes';
import { QueryProvider } from './query-provider';

export function AppProviders({
  direction,
  children,
}: {
  direction: 'rtl' | 'ltr';
  children: React.ReactNode;
}) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <DirectionProvider direction={direction}>
        <MotionConfig reducedMotion="user">
          <QueryProvider>{children}</QueryProvider>
        </MotionConfig>
      </DirectionProvider>
    </ThemeProvider>
  );
}
