import { useLocale, useTranslations } from 'next-intl';
import { JameyaCycle, JameyaDetail, JameyaPayout } from '@/lib/api/jameyas';
import { formatDate, formatMoney, todayIso } from '@/lib/format';
import { JameyaReceiptContent, JameyaReceiptRow } from './jameya-receipt-pdf';

interface PaymentReceiptInput {
  memberName: string;
  amount: number;
  paidAt: string;
  note: string | null;
  balanceAfter: number;
}

interface PayoutReceiptInput {
  holderName: string;
  cycle: Pick<JameyaCycle, 'sequence' | 'dueDate'>;
  payout: Pick<JameyaPayout, 'amount' | 'paidAt' | 'note'>;
  entitlementAmount: number;
  remainingAmount: number;
}

export function useJameyaReceipts(jameya: Pick<JameyaDetail, 'name'>) {
  const t = useTranslations('jameyas.receipt');
  const locale = useLocale();
  const money = (minorUnits: number) => formatMoney(minorUnits, locale, { hideWholeDecimals: true });
  const today = formatDate(todayIso());

  function withNote(rows: JameyaReceiptRow[], note: string | null): JameyaReceiptRow[] {
    return note ? [...rows, { label: t('note'), value: note }] : rows;
  }

  function buildPaymentReceipt(input: PaymentReceiptInput): JameyaReceiptContent {
    return {
      documentLabel: t('documentLabel'),
      title: t('paymentTitle'),
      issuedOn: t('issuedOn', { date: today }),
      amountLabel: t('amountPaid'),
      amount: input.amount,
      rows: [
        ...withNote(
          [
            { label: t('member'), value: input.memberName },
            { label: t('jameya'), value: jameya.name },
            { label: t('paidOn'), value: formatDate(input.paidAt) },
          ],
          input.note,
        ),
        { label: t('balanceAfter'), value: money(input.balanceAfter) },
      ],
      footerPrefix: t('footerPrefix'),
    };
  }

  function buildPayoutReceipt(input: PayoutReceiptInput): JameyaReceiptContent {
    return {
      documentLabel: t('documentLabel'),
      title: t('payoutTitle'),
      issuedOn: t('issuedOn', { date: today }),
      amountLabel: t('amountReceived'),
      amount: input.payout.amount,
      rows: [
        ...withNote(
          [
            { label: t('holder'), value: input.holderName },
            { label: t('jameya'), value: jameya.name },
            {
              label: t('turn'),
              value: t('turnValue', { sequence: input.cycle.sequence, date: formatDate(input.cycle.dueDate) }),
            },
            { label: t('paidOn'), value: formatDate(input.payout.paidAt) },
          ],
          input.payout.note,
        ),
        { label: t('holderPart'), value: money(input.entitlementAmount) },
        { label: t('stillOwedForTurn'), value: money(input.remainingAmount) },
      ],
      footerPrefix: t('footerPrefix'),
    };
  }

  return { buildPaymentReceipt, buildPayoutReceipt };
}
