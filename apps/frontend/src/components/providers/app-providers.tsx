'use client';

import { DirectionProvider } from '@base-ui/react/direction-provider';
import { SerwistProvider } from '@serwist/next/react';
import { MotionConfig } from 'framer-motion';
import { FontSizeProvider } from '@/lib/font-size';
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
    <SerwistProvider swUrl="/sw.js" disable={process.env.NODE_ENV !== 'production'}>
      <ThemeProvider>
        <FontSizeProvider>
          <DirectionProvider direction={direction}>
            <MotionConfig reducedMotion="user">
              <QueryProvider>{children}</QueryProvider>
            </MotionConfig>
          </DirectionProvider>
        </FontSizeProvider>
      </ThemeProvider>
    </SerwistProvider>
  );
}
