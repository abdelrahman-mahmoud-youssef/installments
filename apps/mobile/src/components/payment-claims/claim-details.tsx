import { View } from 'react-native';
import { PaymentClaim } from '@/api/payment-claims';
import { AppText } from '@/components/ui/app-text';
import { Card } from '@/components/ui/card';
import { MoneyText } from '@/components/ui/money-text';
import { ImageThumbnail } from '@/components/ui/image-thumbnail';
import { useI18n } from '@/i18n/i18n-context';
import { formatDate, formatDateTime, isolateLtr } from '@/lib/format';
import { useTheme } from '@/theme/theme-context';
import { spacing } from '@/theme/tokens';
import { useClaimSubject } from './use-claim-subject';

const SCREENSHOT_PREVIEW_SIZE = 96;

interface ClaimDetailsProps {
  claim: PaymentClaim;
}

export function ClaimDetails({ claim }: ClaimDetailsProps) {
  const { t, locale } = useI18n();
  const subject = useClaimSubject(claim);
  const installmentValue = claim.installment
    ? `${subject} · ${formatDate(claim.installment.dueDate, locale)}`
    : t('paymentClaims.notLinked');

  return (
    <View style={{ gap: spacing.md }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.lg }}>
        <ImageThumbnail path={claim.screenshotUrl} label={t('paymentClaims.viewScreenshot')} size={SCREENSHOT_PREVIEW_SIZE} />
        <View style={{ flex: 1, gap: spacing.xs }}>
          <AppText variant="heading" numberOfLines={1}>
            {claim.contract.customer.name}
          </AppText>
          <MoneyText minorUnits={claim.amount} variant="title" />
        </View>
      </View>
      <Card>
        <DetailRow label={t('paymentClaims.product')} value={claim.contract.productName} />
        <DetailRow label={t('paymentClaims.installment')} value={installmentValue} />
        <DetailRow
          label={t('paymentClaims.paymentMethod')}
          value={`${claim.paymentMethod.label} · ${isolateLtr(claim.paymentMethod.details)}`}
        />
        <DetailRow label={t('paymentClaims.submittedAt')} value={formatDateTime(claim.createdAt, locale)} isLast />
      </Card>
    </View>
  );
}

interface DetailRowProps {
  label: string;
  value: string;
  isLast?: boolean;
}

function DetailRow({ label, value, isLast = false }: DetailRowProps) {
  const { colors } = useTheme();
  return (
    <View
      style={{
        gap: 2,
        paddingVertical: spacing.sm,
        borderBottomWidth: isLast ? 0 : 1,
        borderBottomColor: colors.border,
      }}
    >
      <AppText variant="label" tone="muted">
        {label}
      </AppText>
      <AppText>{value}</AppText>
    </View>
  );
}
