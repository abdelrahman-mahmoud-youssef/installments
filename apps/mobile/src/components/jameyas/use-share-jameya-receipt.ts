import { useCallback, useState } from 'react';
import { JameyaCycle, JameyaPayout } from '@/api/jameyas';
import { STATEMENT_PAGE_SIZE } from '@/components/contacts/contact-statement-html';
import { loadStatementFontFaces } from '@/components/contacts/statement-fonts';
import { formatStatementDate, splitStatementMoney } from '@/components/contacts/statement-format';
import { useToast } from '@/components/ui/toast-context';
import { useBranding } from '@/hooks/queries';
import { useI18n } from '@/i18n/i18n-context';
import { describeAmountInWords } from '@/lib/amount-in-words';
import { resolveAssetUrl } from '@/lib/asset-url';
import { BRAND_COLOR_HEX } from '@/lib/brand-colors';
import { formatMoney, formatNumber, todayIsoDate } from '@/lib/format';
import { sharePdf } from '@/lib/share-pdf';
import { buildJameyaReceiptHtml, JameyaReceiptRow } from './jameya-receipt-html';

export interface PaymentReceiptInput {
  memberName: string;
  amount: number;
  paidAt: string;
  note: string | null;
  balanceAfter: number;
}

export interface PayoutReceiptInput {
  holderName: string;
  cycle: Pick<JameyaCycle, 'sequence' | 'dueDate'>;
  payout: Pick<JameyaPayout, 'amount' | 'paidAt' | 'note'>;
  entitlementAmount: number;
  remainingAmount: number;
}

const RECEIPT_FALLBACK_FILE_NAME = 'receipt';

interface ReceiptContent {
  title: string;
  amountLabel: string;
  amount: number;
  rows: JameyaReceiptRow[];
  fileName: string;
}

export function useShareJameyaReceipt(jameyaName: string) {
  const { t, locale, isRTL } = useI18n();
  const { showToast } = useToast();
  const branding = useBranding();
  const [isSharing, setIsSharing] = useState(false);

  const withNote = useCallback(
    (rows: JameyaReceiptRow[], note: string | null): JameyaReceiptRow[] =>
      note ? [...rows, { label: t('jameyas.receipt.note'), value: note }] : rows,
    [t],
  );

  const share = useCallback(
    async (content: ReceiptContent) => {
      if (!branding.data || isSharing) {
        return;
      }
      const shop = branding.data;
      setIsSharing(true);
      try {
        const money = splitStatementMoney(content.amount, locale, { hideWholeDecimals: true });
        const html = buildJameyaReceiptHtml({
          isRTL,
          fontFaces: await loadStatementFontFaces(isRTL),
          documentLabel: t('jameyas.receipt.documentLabel'),
          title: content.title,
          issuedOn: t('jameyas.receipt.issuedOn', { date: formatStatementDate(todayIsoDate()) }),
          amountLabel: content.amountLabel,
          amount: {
            currency: money.currency,
            value: money.amount,
            inWords: describeAmountInWords(content.amount, locale),
          },
          rows: content.rows,
          footerPrefix: t('jameyas.receipt.footerPrefix'),
          shop: {
            name: shop.displayName,
            phone: shop.phone,
            logoUrl: shop.logoUrl ? resolveAssetUrl(shop.logoUrl) : null,
            accentColor: BRAND_COLOR_HEX[shop.brandColor],
          },
        });
        await sharePdf({
          html,
          pageSize: STATEMENT_PAGE_SIZE,
          fileName: content.fileName,
          fallbackFileName: RECEIPT_FALLBACK_FILE_NAME,
          dialogTitle: content.title,
        });
      } catch {
        showToast(t('jameyas.receipt.shareError'), 'error');
      } finally {
        setIsSharing(false);
      }
    },
    [branding.data, isRTL, isSharing, locale, showToast, t],
  );

  const sharePaymentReceipt = useCallback(
    (input: PaymentReceiptInput) =>
      share({
        title: t('jameyas.receipt.paymentTitle'),
        amountLabel: t('jameyas.receipt.amountPaid'),
        amount: input.amount,
        fileName: `${jameyaName} ${input.memberName}`,
        rows: [
          ...withNote(
            [
              { label: t('jameyas.receipt.member'), value: input.memberName },
              { label: t('jameyas.receipt.jameya'), value: jameyaName },
              { label: t('jameyas.receipt.paidOn'), value: formatStatementDate(input.paidAt) },
            ],
            input.note,
          ),
          { label: t('jameyas.receipt.balanceAfter'), value: formatMoney(input.balanceAfter, locale) },
        ],
      }),
    [jameyaName, locale, share, t, withNote],
  );

  const sharePayoutReceipt = useCallback(
    (input: PayoutReceiptInput) =>
      share({
        title: t('jameyas.receipt.payoutTitle'),
        amountLabel: t('jameyas.receipt.amountReceived'),
        amount: input.payout.amount,
        fileName: `${jameyaName} ${input.holderName}`,
        rows: [
          ...withNote(
            [
              { label: t('jameyas.receipt.holder'), value: input.holderName },
              { label: t('jameyas.receipt.jameya'), value: jameyaName },
              {
                label: t('jameyas.receipt.turn'),
                value: t('jameyas.receipt.turnValue', {
                  sequence: formatNumber(input.cycle.sequence, locale),
                  date: formatStatementDate(input.cycle.dueDate),
                }),
              },
              { label: t('jameyas.receipt.paidOn'), value: formatStatementDate(input.payout.paidAt) },
            ],
            input.payout.note,
          ),
          { label: t('jameyas.receipt.holderPart'), value: formatMoney(input.entitlementAmount, locale) },
          { label: t('jameyas.receipt.stillOwedForTurn'), value: formatMoney(input.remainingAmount, locale) },
        ],
      }),
    [jameyaName, locale, share, t, withNote],
  );

  return { sharePaymentReceipt, sharePayoutReceipt, canShare: Boolean(branding.data) && !isSharing };
}
