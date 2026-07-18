'use client';

import { CheckCircle2, Loader2, Send } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import {
  NotificationLanguage,
  NotificationLanguageToggle,
} from '@/components/shared/notification-language-toggle';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import {
  useDisconnectPublicTelegram,
  useSetPublicTelegramEnabled,
  useSetPublicTelegramLanguage,
  useVerifyPublicTelegram,
} from '@/hooks/use-public-telegram';
import type { PublicTelegramStatus } from '@/lib/api/public';

const POLL_INTERVAL_MS = 3000;
const MAX_POLL_ATTEMPTS = 20;

export function TelegramCard({
  telegram,
  publicId,
}: {
  telegram: PublicTelegramStatus;
  publicId: string;
}) {
  const t = useTranslations('publicCustomer');
  const [connected, setConnected] = useState(telegram.connected);
  const [enabled, setEnabled] = useState(telegram.enabled);
  const [language, setLanguageState] = useState(telegram.language);
  const [waiting, setWaiting] = useState(false);

  const verify = useVerifyPublicTelegram(publicId);
  const setEnabledMutation = useSetPublicTelegramEnabled(publicId);
  const setLanguageMutation = useSetPublicTelegramLanguage(publicId);
  const disconnect = useDisconnectPublicTelegram(publicId);

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const attemptsRef = useRef(0);

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
    setWaiting(false);
  }, []);

  useEffect(() => {
    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
      }
    };
  }, []);

  const runVerify = useCallback(async (): Promise<boolean> => {
    try {
      const result = await verify.mutateAsync();
      if (result.connected) {
        setConnected(true);
        setEnabled(result.enabled);
        stopPolling();
        toast.success(t('telegramConnectedToast'));
        return true;
      }
    } catch {
      return false;
    }
    return false;
  }, [verify, stopPolling, t]);

  function handleConnect() {
    window.open(`https://t.me/${telegram.botUsername}?start=${publicId}`, '_blank', 'noopener');
    attemptsRef.current = 0;
    setWaiting(true);
    if (pollRef.current) {
      clearInterval(pollRef.current);
    }
    pollRef.current = setInterval(async () => {
      attemptsRef.current += 1;
      const done = await runVerify();
      if (!done && attemptsRef.current >= MAX_POLL_ATTEMPTS) {
        stopPolling();
      }
    }, POLL_INTERVAL_MS);
  }

  async function handleManualVerify() {
    const done = await runVerify();
    if (!done) {
      toast.info(t('telegramNotYet'));
    }
  }

  async function handleToggle(next: boolean) {
    setEnabled(next);
    try {
      const result = await setEnabledMutation.mutateAsync(next);
      setEnabled(result.enabled);
      toast.success(next ? t('telegramEnabledToast') : t('telegramDisabledToast'));
    } catch {
      setEnabled(!next);
      toast.error(t('telegramError'));
    }
  }

  async function handleDisconnect() {
    try {
      await disconnect.mutateAsync();
      setConnected(false);
      toast.success(t('telegramDisconnectedToast'));
    } catch {
      toast.error(t('telegramError'));
    }
  }

  async function handleLanguageChange(next: NotificationLanguage) {
    const previous = language;
    setLanguageState(next);
    try {
      const result = await setLanguageMutation.mutateAsync(next);
      setLanguageState(result.language);
    } catch {
      setLanguageState(previous);
      toast.error(t('telegramError'));
    }
  }

  return (
    <div className="space-y-4 rounded-xl border border-border bg-card p-5 shadow-xs">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Send className="size-4 text-primary" />
          <h2 className="font-heading font-semibold">{t('telegramTitle')}</h2>
        </div>
        {connected && (
          <Badge variant="secondary">
            <CheckCircle2 className="size-3" />
            {t('telegramConnected')}
          </Badge>
        )}
      </div>

      {connected ? (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">{t('telegramConnectedHint')}</p>
          <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-muted/30 px-4 py-3">
            <span className="text-sm font-medium">{t('telegramEnableLabel')}</span>
            <Switch
              checked={enabled}
              onCheckedChange={handleToggle}
              disabled={setEnabledMutation.isPending}
            />
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDisconnect}
            disabled={disconnect.isPending}
            className="text-muted-foreground"
          >
            {disconnect.isPending && <Loader2 className="size-4 animate-spin" />}
            {t('telegramDisconnect')}
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">{t('telegramDescription')}</p>
          <Button onClick={handleConnect}>
            <Send className="size-4" />
            {t('telegramConnect')}
          </Button>
          {waiting && (
            <div className="flex flex-col gap-2 rounded-lg border border-border bg-muted/30 px-4 py-3">
              <span className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" />
                {t('telegramWaiting')}
              </span>
              <p className="text-xs text-muted-foreground">{t('telegramPressStart')}</p>
              <Button
                variant="outline"
                size="sm"
                onClick={handleManualVerify}
                disabled={verify.isPending}
                className="w-fit"
              >
                {verify.isPending && <Loader2 className="size-4 animate-spin" />}
                {t('telegramVerify')}
              </Button>
            </div>
          )}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
        <span className="text-sm font-medium">{t('telegramLanguageLabel')}</span>
        <NotificationLanguageToggle
          value={language}
          onChange={handleLanguageChange}
          disabled={setLanguageMutation.isPending}
        />
      </div>
    </div>
  );
}
