import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { PaymentClaim } from '@/api/payment-claims';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/i18n/i18n-context';
import { spacing } from '@/theme/tokens';
import { ClaimApprovePanel } from './claim-approve-panel';
import { ClaimDeclinePanel } from './claim-decline-panel';
import { ClaimDetails } from './claim-details';
import { ClaimOutcome } from './claim-outcome';

type ReviewMode = 'approve' | 'decline';

interface ClaimReviewSheetProps {
  claim: PaymentClaim | null;
  onClose: () => void;
}

export function ClaimReviewSheet({ claim, onClose }: ClaimReviewSheetProps) {
  const { t } = useI18n();
  const router = useRouter();
  const [mode, setMode] = useState<ReviewMode>('approve');

  useEffect(() => {
    setMode('approve');
  }, [claim?.id]);

  const openContract = (contractId: string) => {
    onClose();
    router.push(`/contract/${contractId}`);
  };

  const renderActions = (current: PaymentClaim) => {
    if (current.status !== 'PENDING') {
      return <ClaimOutcome claim={current} />;
    }
    if (mode === 'decline') {
      return <ClaimDeclinePanel claim={current} onDeclined={onClose} onBack={() => setMode('approve')} />;
    }
    return (
      <ClaimApprovePanel claim={current} onApproved={onClose} onDeclineRequested={() => setMode('decline')} />
    );
  };

  return (
    <BottomSheet visible={claim !== null} onClose={onClose} title={t('paymentClaims.reviewTitle')}>
      {claim ? (
        <View style={{ gap: spacing.lg }}>
          <ClaimDetails claim={claim} />
          {renderActions(claim)}
          <Button
            title={t('paymentClaims.openContract')}
            variant="ghost"
            icon="document-text-outline"
            onPress={() => openContract(claim.contractId)}
          />
        </View>
      ) : null}
    </BottomSheet>
  );
}
