import { Sparkles } from 'lucide-react';
import { OfferCard } from '@/components/shop/offer-card';
import { Link } from '@/i18n/navigation';
import type { PublicOffer } from '@/lib/api/public';

const PREVIEW_COUNT = 2;

export function ShopOffersSection({
  offers,
  showMoreHref,
  title,
  subtitle,
  showMoreLabel,
}: {
  offers: PublicOffer[];
  showMoreHref: string;
  title: string;
  subtitle: string;
  showMoreLabel: string;
}) {
  const previewOffers = offers.slice(0, PREVIEW_COUNT);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-1.5">
        <Sparkles className="size-4 text-primary" />
        <div>
          <h2 className="font-heading text-sm font-semibold text-foreground">{title}</h2>
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {previewOffers.map((offer) => (
          <OfferCard key={offer.id} offer={offer} />
        ))}
      </div>

      {offers.length > previewOffers.length && (
        <Link
          href={showMoreHref}
          className="flex w-full items-center justify-center rounded-xl border border-dashed border-border bg-card py-3 text-sm font-medium text-primary transition-colors hover:bg-accent"
        >
          {showMoreLabel}
        </Link>
      )}
    </div>
  );
}
