'use client';

import { DirectionProvider } from '@base-ui/react/direction-provider';
import { SerwistProvider } from '@serwist/next/react';
import { MotionConfig } from 'framer-motion';
import { useEffect } from 'react';
import { FontSizeProvider } from '@/lib/font-size';
import { ThemeProvider } from '@/lib/theme';
import { QueryProvider } from './query-provider';

export function AppProviders({
  locale,
  direction,
  children,
}: {
  locale: string;
  direction: 'rtl' | 'ltr';
  children: React.ReactNode;
}) {
  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = direction;
  }, [locale, direction]);

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
