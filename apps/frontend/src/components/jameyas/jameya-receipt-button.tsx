'use client';

import { FileDown, Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { JameyaReceiptContent, JameyaReceiptPdf } from './jameya-receipt-pdf';
import { useJameyaPdfShare } from './use-jameya-pdf-share';

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
  const { share, isGenerating, isReady } = useJameyaPdfShare();

  function handleShare() {
    const content = buildContent();
    void share({
      render: (tenant, locale) => <JameyaReceiptPdf locale={locale} content={content} tenant={tenant} />,
      fileName,
      fallbackFileName: 'receipt',
      title: content.title,
    });
  }

  const icon = isGenerating ? <Loader2 className="size-4 animate-spin" /> : <FileDown className="size-4" />;

  if (variant === 'full') {
    return (
      <Button type="button" variant="outline" disabled={!isReady} onClick={handleShare}>
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
      disabled={!isReady}
      onClick={handleShare}
      aria-label={t('download')}
      title={t('download')}
    >
      {icon}
    </Button>
  );
}
