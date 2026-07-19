'use client';

import { Download, Share, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { isIosSafari, isStandalone } from '@/lib/install-pwa';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
}

export function InstallBanner({ storageKey, message }: { storageKey: string; message: string }) {
  const t = useTranslations('common');
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIosHint, setShowIosHint] = useState(false);
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    if (isStandalone() || localStorage.getItem(storageKey) === 'dismissed') {
      return;
    }
    setDismissed(false);
    if (isIosSafari()) {
      setShowIosHint(true);
    }

    function handlePrompt(event: Event) {
      event.preventDefault();
      setInstallEvent(event as BeforeInstallPromptEvent);
    }
    window.addEventListener('beforeinstallprompt', handlePrompt);
    return () => window.removeEventListener('beforeinstallprompt', handlePrompt);
  }, [storageKey]);

  function handleDismiss() {
    localStorage.setItem(storageKey, 'dismissed');
    setDismissed(true);
  }

  async function handleInstallClick() {
    if (!installEvent) {
      return;
    }
    await installEvent.prompt();
    setDismissed(true);
  }

  if (dismissed || (!installEvent && !showIosHint)) {
    return null;
  }

  const Icon = installEvent ? Download : Share;

  return (
    <div className="flex items-center gap-3 border-b border-border bg-primary/5 px-4 py-2 text-sm sm:px-6">
      <Icon className="size-4 shrink-0 text-primary" />
      <span className="flex-1 text-foreground">{message}</span>
      {installEvent && (
        <Button type="button" size="sm" onClick={handleInstallClick}>
          {t('install')}
        </Button>
      )}
      <button
        type="button"
        onClick={handleDismiss}
        aria-label={t('dismiss')}
        className="shrink-0 text-muted-foreground transition-colors hover:text-foreground"
      >
        <X className="size-4" />
      </button>
    </div>
  );
}
