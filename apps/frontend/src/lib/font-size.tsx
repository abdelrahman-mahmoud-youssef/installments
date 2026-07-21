'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';

export type FontSize = 'smaller' | 'normal' | 'bigger';

interface FontSizeContextValue {
  fontSize: FontSize;
  setFontSize: (fontSize: FontSize) => void;
}

const STORAGE_KEY = 'font-size';

const FONT_SIZE_SCALE: Record<FontSize, string> = {
  smaller: '87.5%',
  normal: '100%',
  bigger: '112.5%',
};

const FontSizeContext = createContext<FontSizeContextValue | null>(null);

export const fontSizeInitScript = `(function(){try{var s=localStorage.getItem('${STORAGE_KEY}');var scale={smaller:'87.5%',normal:'100%',bigger:'112.5%'};document.documentElement.style.fontSize=scale[s]||'100%';}catch(e){}})();`;

function applyFontSize(fontSize: FontSize): void {
  document.documentElement.style.fontSize = FONT_SIZE_SCALE[fontSize];
}

export function FontSizeProvider({ children }: { children: React.ReactNode }) {
  const [fontSize, setFontSizeState] = useState<FontSize>('normal');

  useEffect(() => {
    const stored = (localStorage.getItem(STORAGE_KEY) as FontSize | null) ?? 'normal';
    setFontSizeState(stored);
    applyFontSize(stored);
  }, []);

  const setFontSize = useCallback((next: FontSize) => {
    localStorage.setItem(STORAGE_KEY, next);
    setFontSizeState(next);
    applyFontSize(next);
  }, []);

  return (
    <FontSizeContext.Provider value={{ fontSize, setFontSize }}>{children}</FontSizeContext.Provider>
  );
}

export function useFontSize(): FontSizeContextValue {
  return useContext(FontSizeContext) ?? { fontSize: 'normal', setFontSize: () => undefined };
}
