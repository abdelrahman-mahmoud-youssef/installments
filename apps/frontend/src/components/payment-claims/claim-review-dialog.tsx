'use client';

import { Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { toast } from 'sonner';
import { DateText } from '@/components/shared/date-text';
import { Money } from '@/components/shared/money';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useApprovePaymentClaim, useDeclinePaymentClaim } from '@/hooks/use-payment-claims';
import { ApiError } from '@/lib/api/client';
import { PaymentClaimEntry } from '@/lib/api/payment-claims';
import { resolveAssetUrl } from '@/lib/assets';

export function ClaimReviewDialog({
  claim,
  onOpenChange,
}: {
  claim: PaymentClaimEntry | null;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useTranslations('paymentClaims');
  const tCommon = useTranslations('common');
  const approve = useApprovePaymentClaim();
  const decline = useDeclinePaymentClaim();
  const [declining, setDeclining] = useState(false);
  const [reason, setReason] = useState('');

  async function handleApprove() {
    if (!claim) {
      return;
    }
    try {
      await approve.mutateAsync(claim.id);
      toast.success(t('approved'));
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : t('genericError'));
    }
  }

  async function handleDecline() {
    if (!claim) {
      return;
    }
    try {
      await decline.mutateAsync({ id: claim.id, reason: reason.trim() || undefined });
      toast.success(t('declined'));
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : t('genericError'));
    }
  }

  return (
    <Dialog
      open={claim !== null}
      onOpenChange={(next) => {
        onOpenChange(next);
        if (!next) {
          setDeclining(false);
          setReason('');
        }
      }}
    >
      <DialogContent className="sm:max-w-md">
        {claim && (
          <>
            <DialogHeader>
              <DialogTitle>{claim.contract.customer.name}</DialogTitle>
              <DialogDescription>
                {claim.contract.productName} · #{claim.installment.sequence}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{t('amount')}</span>
                <Money minorUnits={claim.amount} className="font-semibold" />
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{t('method')}</span>
                <span className="font-medium">{claim.paymentMethod.label}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{t('submittedAt')}</span>
                <DateText value={claim.createdAt} />
              </div>

              <a href={resolveAssetUrl(claim.screenshotUrl) ?? '#'} target="_blank" rel="noopener noreferrer">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={resolveAssetUrl(claim.screenshotUrl) ?? ''}
                  alt=""
                  className="max-h-80 w-full rounded-lg border border-border object-contain"
                />
              </a>

              {declining && (
                <Textarea
                  rows={2}
                  placeholder={t('declineReasonPlaceholder')}
                  value={reason}
                  onChange={(event) => setReason(event.target.value)}
                />
              )}
            </div>

            {claim.status === 'PENDING' ? (
              <DialogFooter>
                {declining ? (
                  <>
                    <Button type="button" variant="outline" onClick={() => setDeclining(false)}>
                      {tCommon('cancel')}
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      disabled={decline.isPending}
                      onClick={handleDecline}
                    >
                      {decline.isPending && <Loader2 className="size-4 animate-spin" />}
                      {t('confirmDecline')}
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      type="button"
                      variant="outline"
                      disabled={approve.isPending}
                      onClick={() => setDeclining(true)}
                    >
                      {t('decline')}
                    </Button>
                    <Button type="button" disabled={approve.isPending} onClick={handleApprove}>
                      {approve.isPending && <Loader2 className="size-4 animate-spin" />}
                      {t('approve')}
                    </Button>
                  </>
                )}
              </DialogFooter>
            ) : (
              <div className="rounded-lg bg-muted/50 px-3 py-2 text-sm text-muted-foreground">
                {claim.status === 'APPROVED'
                  ? t('alreadyApproved')
                  : t('alreadyDeclined', { reason: claim.declineReason || t('noReason') })}
              </div>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
