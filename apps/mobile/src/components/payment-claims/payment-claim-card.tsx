import { View } from 'react-native';
import { PaymentClaim } from '@/api/payment-claims';
import { AppText } from '@/components/ui/app-text';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { MoneyText } from '@/components/ui/money-text';
import { PressableScale } from '@/components/ui/pressable-scale';
import { ImageThumbnail } from '@/components/ui/image-thumbnail';
import { useI18n } from '@/i18n/i18n-context';
import { formatDateTime } from '@/lib/format';
import { paymentClaimStatusTone } from '@/lib/statuses';
import { spacing } from '@/theme/tokens';
import { useClaimSubject } from './use-claim-subject';

const SCREENSHOT_THUMBNAIL_SIZE = 56;

interface PaymentClaimCardProps {
  claim: PaymentClaim;
  onPress: () => void;
}

export function PaymentClaimCard({ claim, onPress }: PaymentClaimCardProps) {
  const { t, locale } = useI18n();
  const subject = useClaimSubject(claim);

  return (
    <PressableScale onPress={onPress} accessibilityRole="button">
      <Card>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
          <ImageThumbnail path={claim.screenshotUrl} label={t('paymentClaims.viewScreenshot')} size={SCREENSHOT_THUMBNAIL_SIZE} />
          <View style={{ flex: 1, gap: 2 }}>
            <AppText variant="bodyStrong" numberOfLines={1}>
              {claim.contract.customer.name}
            </AppText>
            <AppText variant="caption" tone="muted" numberOfLines={1}>
              {subject}
            </AppText>
            <AppText variant="label" tone="faint" numberOfLines={1}>
              {claim.paymentMethod.label} · {formatDateTime(claim.createdAt, locale)}
            </AppText>
          </View>
          <View style={{ alignItems: 'flex-end', gap: spacing.xs }}>
            <MoneyText minorUnits={claim.amount} variant="bodyStrong" />
            <Badge label={t(`paymentClaims.status.${claim.status}`)} tone={paymentClaimStatusTone[claim.status]} />
          </View>
        </View>
      </Card>
    </PressableScale>
  );
}
