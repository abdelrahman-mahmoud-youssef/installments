import { useState } from 'react';
import { View } from 'react-native';
import { PaymentClaim } from '@/api/payment-claims';
import { resolveAuthErrorMessage } from '@/auth/resolve-auth-error';
import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { TextField } from '@/components/ui/text-field';
import { useToast } from '@/components/ui/toast-context';
import { useDeclinePaymentClaim } from '@/hooks/queries';
import { useI18n } from '@/i18n/i18n-context';
import { spacing } from '@/theme/tokens';

const DECLINE_REASON_MAX_LENGTH = 500;

interface ClaimDeclinePanelProps {
  claim: PaymentClaim;
  onDeclined: () => void;
  onBack: () => void;
}

export function ClaimDeclinePanel({ claim, onDeclined, onBack }: ClaimDeclinePanelProps) {
  const { t } = useI18n();
  const { showToast } = useToast();
  const declineMutation = useDeclinePaymentClaim();
  const [reason, setReason] = useState('');

  const decline = () => {
    declineMutation.mutate(
      { id: claim.id, input: { reason: reason.trim() || undefined } },
      {
        onSuccess: () => {
          showToast(t('paymentClaims.declinedToast'));
          onDeclined();
        },
        onError: (caught) => showToast(resolveAuthErrorMessage(caught, t), 'error'),
      },
    );
  };

  return (
    <View style={{ gap: spacing.lg }}>
      <View style={{ gap: spacing.xs }}>
        <AppText variant="heading">{t('paymentClaims.declineTitle')}</AppText>
        <AppText tone="muted">{t('paymentClaims.declineMessage')}</AppText>
      </View>
      <TextField
        label={t('paymentClaims.reason')}
        value={reason}
        onChangeText={setReason}
        placeholder={t('paymentClaims.reasonPlaceholder')}
        maxLength={DECLINE_REASON_MAX_LENGTH}
        optional
        multiline
      />
      <View style={{ gap: spacing.md }}>
        <Button
          title={t('paymentClaims.confirmDecline')}
          variant="destructive"
          onPress={decline}
          loading={declineMutation.isPending}
        />
        <Button
          title={t('common.back')}
          variant="secondary"
          onPress={onBack}
          disabled={declineMutation.isPending}
        />
      </View>
    </View>
  );
}
