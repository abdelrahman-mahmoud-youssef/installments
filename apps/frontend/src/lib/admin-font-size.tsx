'use client';

import { createContext, useCallback, useContext, useEffect, useSyncExternalStore } from 'react';

export type FontSize = 'smaller' | 'normal' | 'bigger';

interface AdminFontSizeContextValue {
  fontSize: FontSize;
  setFontSize: (fontSize: FontSize) => void;
}

const STORAGE_KEY = 'admin-font-size';
const PUBLIC_STORAGE_KEY = 'font-size';

const FONT_SIZE_SCALE: Record<FontSize, string> = {
  smaller: '87.5%',
  normal: '100%',
  bigger: '112.5%',
};

const AdminFontSizeContext = createContext<AdminFontSizeContextValue | null>(null);

const listeners = new Set<() => void>();

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function readStoredFontSize(): FontSize {
  return (localStorage.getItem(STORAGE_KEY) as FontSize | null) ?? 'normal';
}

function getServerSnapshot(): FontSize {
  return 'normal';
}

function writeFontSize(next: FontSize): void {
  localStorage.setItem(STORAGE_KEY, next);
  listeners.forEach((listener) => listener());
}

function applyFontSize(fontSize: FontSize): void {
  document.documentElement.style.fontSize = FONT_SIZE_SCALE[fontSize];
}

function publicFontSize(): FontSize {
  return (localStorage.getItem(PUBLIC_STORAGE_KEY) as FontSize | null) ?? 'normal';
}

export function AdminFontSizeProvider({ children }: { children: React.ReactNode }) {
  const fontSize = useSyncExternalStore(subscribe, readStoredFontSize, getServerSnapshot);

  useEffect(() => {
    applyFontSize(fontSize);
  }, [fontSize]);

  useEffect(() => {
    return () => {
      applyFontSize(publicFontSize());
    };
  }, []);

  const setFontSize = useCallback((next: FontSize) => {
    writeFontSize(next);
  }, []);

  return (
    <AdminFontSizeContext.Provider value={{ fontSize, setFontSize }}>{children}</AdminFontSizeContext.Provider>
  );
}

export function useAdminFontSize(): AdminFontSizeContextValue {
  return useContext(AdminFontSizeContext) ?? { fontSize: 'normal', setFontSize: () => undefined };
}
