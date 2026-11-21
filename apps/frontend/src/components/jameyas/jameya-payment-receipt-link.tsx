'use client';

import { ImageIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { resolveAssetUrl } from '@/lib/assets';

export function JameyaPaymentReceiptLink({ receiptUrl }: { receiptUrl: string | null }) {
  const t = useTranslations('jameyas.detail');
  const href = resolveAssetUrl(receiptUrl);
  if (!href) {
    return null;
  }
  return (
    <Button
      variant="ghost"
      size="icon-sm"
      aria-label={t('viewReceipt')}
      title={t('viewReceipt')}
      render={<a href={href} target="_blank" rel="noopener noreferrer" />}
    >
      <ImageIcon className="size-4" />
    </Button>
  );
}
