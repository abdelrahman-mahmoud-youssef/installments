import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PaymentClaim } from '@/api/payment-claims';
import { AppText } from '@/components/ui/app-text';
import { Card } from '@/components/ui/card';
import { useI18n } from '@/i18n/i18n-context';
import { formatDateTime } from '@/lib/format';
import { useTheme } from '@/theme/theme-context';
import { spacing } from '@/theme/tokens';

interface ClaimOutcomeProps {
  claim: PaymentClaim;
}

export function ClaimOutcome({ claim }: ClaimOutcomeProps) {
  const { t, locale } = useI18n();
  const { colors } = useTheme();
  const isApproved = claim.status === 'APPROVED';
  const reviewedDate = claim.reviewedAt ? formatDateTime(claim.reviewedAt, locale) : '';
  const title = isApproved
    ? t('paymentClaims.approvedOn', { date: reviewedDate })
    : t('paymentClaims.declinedOn', { date: reviewedDate });

  return (
    <Card style={{ backgroundColor: isApproved ? colors.successMuted : colors.dangerMuted }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
        <Ionicons
          name={isApproved ? 'checkmark-circle' : 'close-circle'}
          size={22}
          color={isApproved ? colors.success : colors.danger}
        />
        <View style={{ flex: 1, gap: 2 }}>
          <AppText variant="bodyStrong" tone={isApproved ? 'success' : 'danger'}>
            {title}
          </AppText>
          {isApproved ? null : (
            <AppText variant="caption" tone="muted">
              {claim.declineReason ?? t('paymentClaims.noReason')}
            </AppText>
          )}
        </View>
      </View>
    </Card>
  );
}
