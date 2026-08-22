'use client';

import { pdf } from '@react-pdf/renderer';
import { Loader2, Share2 } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useState } from 'react';
import { toast } from 'sonner';
import { ContactStatementPdf } from '@/components/payment-methods/contact-statement-pdf';
import { Button } from '@/components/ui/button';
import { useBranding } from '@/hooks/use-branding';
import { Counterparty } from '@/lib/api/counterparties';
import { resolveAssetUrl } from '@/lib/assets';
import { formatDateTime } from '@/lib/format';

function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}

export function ContactStatementShareButton({ contact }: { contact: Counterparty }) {
  const t = useTranslations('contacts');
  const locale = useLocale();
  const { data: branding } = useBranding();
  const [isGenerating, setIsGenerating] = useState(false);

  async function generateStatement(): Promise<{ blob: Blob; fileName: string }> {
    if (!branding) {
      throw new Error('Branding not loaded');
    }
    const doc = (
      <ContactStatementPdf
        locale={locale === 'ar' ? 'ar' : 'en'}
        copy={{
          documentLabel: t('detail.pdfDocumentLabel'),
          title: t('detail.pdfTitle'),
          generatedOn: `${t('detail.pdfGeneratedOnLabel')} ${formatDateTime(new Date(), locale)}`,
          contactLabel: t('detail.pdfContactLabel'),
          phoneLabel: t('phone'),
          balanceLabel: t('detail.balanceLabel'),
          theyOwe: t('detail.theyOwe'),
          youOwe: t('detail.youOwe'),
          settled: t('detail.settled'),
          footer: t('detail.pdfFooter', { tenant: branding.displayName }),
        }}
        tenant={{
          displayName: branding.displayName,
          logoUrl: resolveAssetUrl(branding.logoUrl),
          phone: branding.phone,
          brandColor: branding.brandColor,
        }}
        contact={{ name: contact.name, phone: contact.phone, balance: contact.balance }}
      />
    );
    const blob = await pdf(doc).toBlob();
    return { blob, fileName: `statement-${contact.id}.pdf` };
  }

  async function handleShare() {
    setIsGenerating(true);
    try {
      const { blob, fileName } = await generateStatement();
      const file = new File([blob], fileName, { type: 'application/pdf' });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: t('detail.pdfTitle') });
        return;
      }
      downloadBlob(blob, fileName);
    } catch (error) {
      if (!(error instanceof DOMException && error.name === 'AbortError')) {
        console.error(error);
        toast.error(t('detail.shareError'));
      }
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <Button type="button" variant="outline" size="sm" disabled={isGenerating || !branding} onClick={handleShare}>
      {isGenerating ? <Loader2 className="size-4 animate-spin" /> : <Share2 className="size-4" />}
      {t('detail.share')}
    </Button>
  );
}
