import { File, Paths } from 'expo-file-system';
import { printToFileAsync } from 'expo-print';
import { shareAsync } from 'expo-sharing';
import { useCallback, useState } from 'react';
import { Counterparty } from '@/api/counterparties';
import { TenantBranding } from '@/api/branding';
import { useToast } from '@/components/ui/toast-context';
import { useBranding } from '@/hooks/queries';
import { useI18n } from '@/i18n/i18n-context';
import { describeAmountInWords } from '@/lib/amount-in-words';
import { resolveAssetUrl } from '@/lib/asset-url';
import { BRAND_COLOR_HEX } from '@/lib/brand-colors';
import { balanceStatus } from '@/lib/counterparty-balance';
import { formatDateTime, formatMoney } from '@/lib/format';
import { buildContactStatementHtml } from './contact-statement-html';

const PDF_MIME_TYPE = 'application/pdf';
const PDF_UTI = 'com.adobe.pdf';
const FALLBACK_FILE_NAME = 'statement';
const UNSAFE_FILE_NAME_CHARACTERS = /[\\/:*?"<>|]+/g;

function statementFileName(shopName: string): string {
  const safeName = shopName.replace(UNSAFE_FILE_NAME_CHARACTERS, ' ').trim();
  return `${safeName || FALLBACK_FILE_NAME}.pdf`;
}

async function renameInCache(uri: string, fileName: string): Promise<string> {
  const destination = new File(Paths.cache, fileName);
  await new File(uri).move(destination, { overwrite: true });
  return destination.uri;
}

export function useShareStatement() {
  const { t, locale, isRTL } = useI18n();
  const { showToast } = useToast();
  const branding = useBranding();
  const [isSharing, setIsSharing] = useState(false);

  const buildHtml = useCallback(
    (contact: Counterparty, shop: TenantBranding) => {
      const status = balanceStatus(contact.balance);
      return buildContactStatementHtml({
        isRTL,
        copy: {
          documentLabel: t('contacts.pdfDocumentLabel'),
          title: t('contacts.pdfTitle'),
          generatedOn: t('contacts.pdfGeneratedOn', { date: formatDateTime(new Date().toISOString(), locale) }),
          contactLabel: t('contacts.pdfContactLabel'),
          phoneLabel: t('contacts.phone'),
          balanceLabel: t('contacts.balance'),
          balanceHint: t(`contacts.${status}`),
          footer: t('contacts.pdfFooter', { shop: shop.displayName }),
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
          amount: formatMoney(Math.abs(contact.balance), locale),
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
        const { uri } = await printToFileAsync({ html: buildHtml(contact, branding.data) });
        const fileUri = await renameInCache(uri, statementFileName(branding.data.displayName));
        await shareAsync(fileUri, { mimeType: PDF_MIME_TYPE, UTI: PDF_UTI, dialogTitle: t('contacts.pdfTitle') });
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
