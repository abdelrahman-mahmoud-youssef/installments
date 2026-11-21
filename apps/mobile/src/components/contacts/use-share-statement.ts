import { useCallback, useState } from 'react';
import { TenantBranding } from '@/api/branding';
import { Counterparty } from '@/api/counterparties';
import { useToast } from '@/components/ui/toast-context';
import { useBranding } from '@/hooks/queries';
import { useI18n } from '@/i18n/i18n-context';
import { describeAmountInWords } from '@/lib/amount-in-words';
import { resolveAssetUrl } from '@/lib/asset-url';
import { BRAND_COLOR_HEX } from '@/lib/brand-colors';
import { BalanceStatus, balanceStatus } from '@/lib/counterparty-balance';
import { sharePdf } from '@/lib/share-pdf';
import { buildContactStatementHtml, STATEMENT_PAGE_SIZE } from './contact-statement-html';
import { loadStatementFontFaces } from './statement-fonts';
import { formatStatementDateTime, splitStatementMoney } from './statement-format';

const STATEMENT_FALLBACK_FILE_NAME = 'statement';

const BALANCE_HINT_KEYS: Record<BalanceStatus, string> = {
  theyOwe: 'contacts.pdfTheyOwe',
  youOwe: 'contacts.pdfYouOwe',
  settled: 'contacts.pdfSettled',
};

export function useShareStatement() {
  const { t, locale, isRTL } = useI18n();
  const { showToast } = useToast();
  const branding = useBranding();
  const [isSharing, setIsSharing] = useState(false);

  const buildHtml = useCallback(
    async (contact: Counterparty, shop: TenantBranding) => {
      const status = balanceStatus(contact.balance);
      return buildContactStatementHtml({
        isRTL,
        fontFaces: await loadStatementFontFaces(isRTL),
        copy: {
          documentLabel: t('contacts.pdfDocumentLabel'),
          title: t('contacts.pdfTitle'),
          generatedOn: t('contacts.pdfGeneratedOn', { date: formatStatementDateTime(new Date()) }),
          contactLabel: t('contacts.pdfContactLabel'),
          phoneLabel: t('contacts.pdfPhoneLabel'),
          balanceLabel: t('contacts.pdfBalanceLabel'),
          balanceHint: t(BALANCE_HINT_KEYS[status]),
          footerPrefix: t('contacts.pdfFooterPrefix'),
        },
        shop: {
          name: shop.displayName,
          phone: shop.phone,
          logoUrl: shop.logoUrl ? resolveAssetUrl(shop.logoUrl) : null,
          accentColor: BRAND_COLOR_HEX[shop.brandColor],
        },
        contact: { name: contact.name, phone: contact.phone },
        balance: {
          status,
          ...splitStatementMoney(contact.balance, locale),
          inWords: describeAmountInWords(contact.balance, locale),
        },
      });
    },
    [isRTL, locale, t],
  );

  const shareStatement = useCallback(
    async (contact: Counterparty) => {
      if (!branding.data || isSharing) {
        return;
      }
      setIsSharing(true);
      try {
        await sharePdf({
          html: await buildHtml(contact, branding.data),
          pageSize: STATEMENT_PAGE_SIZE,
          fileName: branding.data.displayName,
          fallbackFileName: STATEMENT_FALLBACK_FILE_NAME,
          dialogTitle: t('contacts.pdfTitle'),
        });
      } catch {
        showToast(t('contacts.shareError'), 'error');
      } finally {
        setIsSharing(false);
      }
    },
    [branding.data, buildHtml, isSharing, showToast, t],
  );

  return { shareStatement, canShare: Boolean(branding.data) && !isSharing };
}
