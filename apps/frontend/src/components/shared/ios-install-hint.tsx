'use client';

import { Share, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { isIosSafari, isStandalone } from '@/lib/install-pwa';

export function IosInstallHint({
  storageKey,
  message,
  dismissLabel,
}: {
  storageKey: string;
  message: string;
  dismissLabel: string;
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!isIosSafari() || isStandalone()) {
      return;
    }
    if (localStorage.getItem(storageKey) === 'dismissed') {
      return;
    }
    setVisible(true);
  }, [storageKey]);

  function handleDismiss() {
    localStorage.setItem(storageKey, 'dismissed');
    setVisible(false);
  }

  if (!visible) {
    return null;
  }

  return (
    <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
      <Share className="size-3.5 shrink-0" />
      <span className="flex-1">{message}</span>
      <button
        type="button"
        onClick={handleDismiss}
        aria-label={dismissLabel}
        className="shrink-0 text-muted-foreground transition-colors hover:text-foreground"
      >
        <X className="size-3.5" />
      </button>
    </div>
  );
}
