'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Check, Copy, Loader2, ShieldCheck, Smartphone } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { QRCodeSVG } from 'qrcode.react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useMediaQuery } from '@/hooks/use-media-query';
import { useDisableTwoFactor, useEnableTwoFactor, useSetupTwoFactor } from '@/hooks/use-two-factor';
import { ApiError } from '@/lib/api/client';
import { TwoFactorCodeInput, twoFactorCodeSchema } from '@/lib/schemas/auth';

type Step = 'enrollQr' | 'backupCodes' | 'disable';

export function TwoFactorSetupDialog({
  open,
  onOpenChange,
  twoFactorEnabled,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  twoFactorEnabled: boolean;
}) {
  const t = useTranslations('twoFactor');
  const setupTwoFactor = useSetupTwoFactor();
  const enableTwoFactor = useEnableTwoFactor();
  const disableTwoFactor = useDisableTwoFactor();
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [wasOpen, setWasOpen] = useState(open);
  const isTouchDevice = useMediaQuery('(pointer: coarse)');

  const form = useForm<TwoFactorCodeInput>({
    resolver: zodResolver(twoFactorCodeSchema),
    defaultValues: { code: '' },
  });

  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setBackupCodes([]);
    }
  }

  const step: Step = backupCodes.length > 0 ? 'backupCodes' : twoFactorEnabled ? 'disable' : 'enrollQr';

  useEffect(() => {
    if (!open) {
      return;
    }
    form.reset({ code: '' });
    if (!twoFactorEnabled) {
      setupTwoFactor.mutate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, twoFactorEnabled]);

  async function handleEnable(values: TwoFactorCodeInput) {
    try {
      const result = await enableTwoFactor.mutateAsync(values.code);
      setBackupCodes(result.backupCodes);
      form.reset({ code: '' });
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : t('genericError'));
    }
  }

  async function handleDisable(values: TwoFactorCodeInput) {
    try {
      await disableTwoFactor.mutateAsync(values.code);
      toast.success(t('disabled'));
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : t('genericError'));
    }
  }

  function handleCopyBackupCodes() {
    navigator.clipboard.writeText(backupCodes.join('\n'));
    toast.success(t('backupCodesCopied'));
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next && step === 'backupCodes') {
          return;
        }
        onOpenChange(next);
      }}
    >
      <DialogContent className="sm:max-w-md">
        {step === 'enrollQr' && (
          <>
            <DialogHeader>
              <DialogTitle>{t('setupTitle')}</DialogTitle>
              <DialogDescription>{t('setupDescription')}</DialogDescription>
            </DialogHeader>
            {setupTwoFactor.isPending || !setupTwoFactor.data ? (
              <div className="flex justify-center py-8">
                <Loader2 className="size-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <>
                <div className="flex justify-center rounded-xl border border-border bg-white p-5">
                  <QRCodeSVG value={setupTwoFactor.data.otpauthUrl} size={180} />
                </div>
                <p className="text-center text-xs text-muted-foreground">
                  {t('manualEntryHint')}{' '}
                  <span dir="ltr" className="font-mono font-medium text-foreground">
                    {setupTwoFactor.data.secret}
                  </span>
                </p>
                {isTouchDevice && (
                  <Button variant="outline" render={<a href={setupTwoFactor.data.otpauthUrl} target="_blank" rel="noopener noreferrer" />}>
                    <Smartphone className="size-4" />
                    {t('openInAuthenticatorApp')}
                  </Button>
                )}
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(handleEnable)} className="flex flex-col gap-4">
                    <FormField
                      control={form.control}
                      name="code"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input
                              dir="ltr"
                              inputMode="numeric"
                              autoComplete="one-time-code"
                              placeholder={t('codePlaceholder')}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <DialogFooter>
                      <Button type="submit" disabled={form.formState.isSubmitting}>
                        {form.formState.isSubmitting && <Loader2 className="size-4 animate-spin" />}
                        {t('confirmButton')}
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </>
            )}
          </>
        )}

        {step === 'backupCodes' && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <ShieldCheck className="size-5 text-success" />
                {t('backupCodesTitle')}
              </DialogTitle>
              <DialogDescription>{t('backupCodesDescription')}</DialogDescription>
            </DialogHeader>
            <div dir="ltr" className="grid grid-cols-2 gap-2 rounded-xl border border-border bg-muted/40 p-4 font-mono text-sm">
              {backupCodes.map((code) => (
                <span key={code}>{code}</span>
              ))}
            </div>
            <DialogFooter className="gap-2 sm:justify-between">
              <Button type="button" variant="outline" onClick={handleCopyBackupCodes}>
                <Copy className="size-4" />
                {t('copyBackupCodes')}
              </Button>
              <Button type="button" onClick={() => onOpenChange(false)}>
                <Check className="size-4" />
                {t('doneButton')}
              </Button>
            </DialogFooter>
          </>
        )}

        {step === 'disable' && (
          <>
            <DialogHeader>
              <DialogTitle>{t('manageTitle')}</DialogTitle>
              <DialogDescription>{t('manageDescription')}</DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleDisable)} className="flex flex-col gap-4">
                <FormField
                  control={form.control}
                  name="code"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input
                          dir="ltr"
                          inputMode="numeric"
                          autoComplete="one-time-code"
                          placeholder={t('codePlaceholder')}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button type="submit" variant="destructive" disabled={form.formState.isSubmitting}>
                    {form.formState.isSubmitting && <Loader2 className="size-4 animate-spin" />}
                    {t('disableButton')}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
