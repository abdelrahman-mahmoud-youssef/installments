import { useState } from 'react';
import { View } from 'react-native';
import { PaymentClaim } from '@/api/payment-claims';
import { resolveAuthErrorMessage } from '@/auth/resolve-auth-error';
import { Button } from '@/components/ui/button';
import { TextField } from '@/components/ui/text-field';
import { useToast } from '@/components/ui/toast-context';
import { useApprovePaymentClaim } from '@/hooks/queries';
import { useI18n } from '@/i18n/i18n-context';
import { parseAmountInput, toMajorUnits, toMinorUnits } from '@/lib/format';
import { spacing } from '@/theme/tokens';

interface ClaimApprovePanelProps {
  claim: PaymentClaim;
  onApproved: () => void;
  onDeclineRequested: () => void;
}

export function ClaimApprovePanel({ claim, onApproved, onDeclineRequested }: ClaimApprovePanelProps) {
  const { t } = useI18n();
  const { showToast } = useToast();
  const approveMutation = useApprovePaymentClaim();
  const [amount, setAmount] = useState(String(toMajorUnits(claim.amount)));
  const [error, setError] = useState<string | null>(null);

  const approve = () => {
    const parsedAmount = parseAmountInput(amount);
    if (parsedAmount === null) {
      setError(t('paymentClaims.amountRequired'));
      return;
    }
    setError(null);
    approveMutation.mutate(
      { id: claim.id, input: { amount: toMinorUnits(parsedAmount) } },
      {
        onSuccess: () => {
          showToast(t('paymentClaims.approvedToast'));
          onApproved();
        },
        onError: (caught) => showToast(resolveAuthErrorMessage(caught, t), 'error'),
      },
    );
  };

  return (
    <View style={{ gap: spacing.lg }}>
      <TextField
        label={t('paymentClaims.amount')}
        value={amount}
        onChangeText={setAmount}
        keyboardType="decimal-pad"
        hint={t('paymentClaims.amountHint')}
        error={error ?? undefined}
      />
      <View style={{ gap: spacing.md }}>
        <Button
          title={t('paymentClaims.approve')}
          icon="checkmark-circle-outline"
          onPress={approve}
          loading={approveMutation.isPending}
        />
        <Button
          title={t('paymentClaims.decline')}
          variant="destructive"
          onPress={onDeclineRequested}
          disabled={approveMutation.isPending}
        />
      </View>
    </View>
  );
}
