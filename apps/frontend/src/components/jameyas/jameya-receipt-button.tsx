'use client';

import { pdf } from '@react-pdf/renderer';
import { FileDown, Loader2 } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { useBranding } from '@/hooks/use-branding';
import { resolveAssetUrl } from '@/lib/assets';
import { isShareAbort, sanitizeFileName, shareOrDownloadPdf } from '@/lib/share-file';
import { JameyaReceiptContent, JameyaReceiptPdf } from './jameya-receipt-pdf';

export function JameyaReceiptButton({
  buildContent,
  fileName,
  variant = 'icon',
}: {
  buildContent: () => JameyaReceiptContent;
  fileName: string;
  variant?: 'icon' | 'full';
}) {
  const t = useTranslations('jameyas.receipt');
  const locale = useLocale();
  const { data: branding } = useBranding();
  const [isGenerating, setIsGenerating] = useState(false);

  async function handleShare() {
    if (!branding) {
      return;
    }
    setIsGenerating(true);
    try {
      const content = buildContent();
      const blob = await pdf(
        <JameyaReceiptPdf
          locale={locale === 'ar' ? 'ar' : 'en'}
          content={content}
          tenant={{
            displayName: branding.displayName,
            logoUrl: resolveAssetUrl(branding.logoUrl),
            phone: branding.phone,
            brandColor: branding.brandColor,
          }}
        />,
      ).toBlob();
      await shareOrDownloadPdf(blob, `${sanitizeFileName(fileName, 'receipt')}.pdf`, content.title);
    } catch (error) {
      if (!isShareAbort(error)) {
        console.error(error);
        toast.error(t('shareError'));
      }
    } finally {
      setIsGenerating(false);
    }
  }

  const icon = isGenerating ? <Loader2 className="size-4 animate-spin" /> : <FileDown className="size-4" />;

  if (variant === 'full') {
    return (
      <Button type="button" variant="outline" disabled={isGenerating || !branding} onClick={handleShare}>
        {icon}
        {t('download')}
      </Button>
    );
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      disabled={isGenerating || !branding}
      onClick={handleShare}
      aria-label={t('download')}
      title={t('download')}
    >
      {icon}
    </Button>
  );
}
