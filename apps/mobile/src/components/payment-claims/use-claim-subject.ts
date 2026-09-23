import { PaymentClaim } from '@/api/payment-claims';
import { useI18n } from '@/i18n/i18n-context';
import { formatNumber } from '@/lib/format';

export function useClaimSubject(claim: PaymentClaim): string {
  const { t, locale } = useI18n();
  if (!claim.installment) {
    return claim.contract.productName;
  }
  const installmentLabel = t('dashboard.installmentNumber', {
    sequence: formatNumber(claim.installment.sequence, locale),
  });
  return `${claim.contract.productName} · ${installmentLabel}`;
}
