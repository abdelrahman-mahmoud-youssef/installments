'use client';

import { Images } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { OfferGalleryDialog } from '@/components/shop/offer-gallery-dialog';
import type { PublicOffer } from '@/lib/api/public';

export function OfferCard({ offer }: { offer: PublicOffer }) {
  const t = useTranslations('publicShop.offers');
  const [galleryOpen, setGalleryOpen] = useState(false);

  return (
    <>
      <div className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-xs transition-shadow hover:shadow-md">
        <button
          type="button"
          onClick={() => setGalleryOpen(true)}
          className="relative block aspect-4/3 w-full overflow-hidden"
        >
          <img
            src={offer.images[0]}
            alt={offer.title}
            loading="lazy"
            className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
          {offer.tag && <Badge className="absolute top-2.5 start-2.5 shadow-sm">{offer.tag}</Badge>}
          {offer.images.length > 1 && (
            <span className="absolute top-2.5 end-2.5 inline-flex items-center gap-1 rounded-full bg-black/60 px-2 py-0.5 text-xs font-medium text-white">
              <Images className="size-3" />
              {offer.images.length}
            </span>
          )}
          <p className="absolute inset-x-3 bottom-2.5 truncate text-start font-heading text-sm font-semibold text-white">
            {offer.title}
          </p>
        </button>

        <div className="flex flex-1 flex-col gap-2 p-4">
          {offer.description && <p className="line-clamp-2 text-sm text-muted-foreground">{offer.description}</p>}
          <button
            type="button"
            onClick={() => setGalleryOpen(true)}
            className="mt-auto inline-flex w-fit items-center gap-1.5 text-xs font-medium text-primary hover:underline"
          >
            <Images className="size-3.5" />
            {t('viewGallery')}
          </button>
        </div>
      </div>

      <OfferGalleryDialog
        open={galleryOpen}
        onOpenChange={setGalleryOpen}
        title={offer.title}
        images={offer.images}
        counterLabel={(current, total) => t('imageCounter', { current, total })}
      />
    </>
  );
}
