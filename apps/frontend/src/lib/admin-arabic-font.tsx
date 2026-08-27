'use client';

import { createContext, useCallback, useContext, useSyncExternalStore } from 'react';
import { ArabicFontPreset } from '@/lib/schemas/admin-appearance';

interface AdminArabicFontContextValue {
  arabicFont: ArabicFontPreset;
  setArabicFont: (preset: ArabicFontPreset) => void;
}

const STORAGE_KEY = 'admin-arabic-font';

export const ARABIC_FONT_VAR_MAP: Record<ArabicFontPreset, string> = {
  plex: 'var(--font-plex-ar)',
  cairo: 'var(--font-cairo)',
  tajawal: 'var(--font-tajawal)',
  notoSansArabic: 'var(--font-noto-sans-arabic)',
  almarai: 'var(--font-almarai)',
};

const AdminArabicFontContext = createContext<AdminArabicFontContextValue | null>(null);

const listeners = new Set<() => void>();

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function readStoredArabicFont(): ArabicFontPreset {
  return (localStorage.getItem(STORAGE_KEY) as ArabicFontPreset | null) ?? 'plex';
}

function getServerSnapshot(): ArabicFontPreset {
  return 'plex';
}

function writeArabicFont(next: ArabicFontPreset): void {
  localStorage.setItem(STORAGE_KEY, next);
  listeners.forEach((listener) => listener());
}

export function AdminArabicFontProvider({ children }: { children: React.ReactNode }) {
  const arabicFont = useSyncExternalStore(subscribe, readStoredArabicFont, getServerSnapshot);

  const setArabicFont = useCallback((next: ArabicFontPreset) => {
    writeArabicFont(next);
  }, []);

  return (
    <AdminArabicFontContext.Provider value={{ arabicFont, setArabicFont }}>
      <div style={{ '--font-plex-ar': ARABIC_FONT_VAR_MAP[arabicFont] } as React.CSSProperties}>{children}</div>
    </AdminArabicFontContext.Provider>
  );
}

export function useAdminArabicFont(): AdminArabicFontContextValue {
  return useContext(AdminArabicFontContext) ?? { arabicFont: 'plex', setArabicFont: () => undefined };
}
