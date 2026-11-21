'use client';

import { DocumentProps, pdf } from '@react-pdf/renderer';
import { useLocale, useTranslations } from 'next-intl';
import { ReactElement, useState } from 'react';
import { toast } from 'sonner';
import { useBranding } from '@/hooks/use-branding';
import { resolveAssetUrl } from '@/lib/assets';
import { BrandColorPreset } from '@/lib/schemas/branding';
import { PdfLocale } from '@/lib/pdf';
import { isShareAbort, sanitizeFileName, shareOrDownloadPdf } from '@/lib/share-file';

export interface JameyaPdfTenant {
  displayName: string;
  logoUrl: string | null;
  phone: string | null;
  brandColor: BrandColorPreset;
}

interface JameyaPdfRequest {
  render: (tenant: JameyaPdfTenant, locale: PdfLocale) => ReactElement<DocumentProps>;
  fileName: string;
  fallbackFileName: string;
  title: string;
}

export function useJameyaPdfShare() {
  const t = useTranslations('jameyas.receipt');
  const locale = useLocale();
  const { data: branding } = useBranding();
  const [isGenerating, setIsGenerating] = useState(false);

  async function share({ render, fileName, fallbackFileName, title }: JameyaPdfRequest) {
    if (!branding) {
      return;
    }
    setIsGenerating(true);
    try {
      const tenant = {
        displayName: branding.displayName,
        logoUrl: resolveAssetUrl(branding.logoUrl),
        phone: branding.phone,
        brandColor: branding.brandColor,
      };
      const blob = await pdf(render(tenant, locale === 'ar' ? 'ar' : 'en')).toBlob();
      await shareOrDownloadPdf(blob, `${sanitizeFileName(fileName, fallbackFileName)}.pdf`, title);
    } catch (error) {
      if (!isShareAbort(error)) {
        console.error(error);
        toast.error(t('shareError'));
      }
    } finally {
      setIsGenerating(false);
    }
  }

  return { share, isGenerating, isReady: Boolean(branding) && !isGenerating };
}
