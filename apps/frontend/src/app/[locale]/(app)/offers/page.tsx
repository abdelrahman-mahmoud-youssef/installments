'use client';

import { ImageOff, Pencil, Plus, Sparkles, Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { toast } from 'sonner';
import { OfferFormDialog } from '@/components/offers/offer-form-dialog';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { EmptyState } from '@/components/shared/empty-state';
import { FadeIn } from '@/components/shared/motion';
import { PageHeader } from '@/components/shared/page-header';
import { PaginationControls } from '@/components/shared/pagination-controls';
import { SearchInput } from '@/components/shared/search-input';
import { Section } from '@/components/shared/section';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { useBranding } from '@/hooks/use-branding';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import {
  useCreateOffer,
  useDeleteOffer,
  useOffers,
  useSetOfferActive,
  useSetOffersVisibility,
  useUpdateOffer,
} from '@/hooks/use-offers';
import { ApiError } from '@/lib/api/client';
import type { Offer } from '@/lib/api/offers';
import { resolveAssetUrl } from '@/lib/assets';

function OfferCardSkeleton() {
  return <Skeleton className="h-64 w-full rounded-xl" />;
}

function AdminOfferCard({ offer }: { offer: Offer }) {
  const t = useTranslations('offers');
  const setActive = useSetOfferActive();
  const updateOffer = useUpdateOffer(offer.id);
  const deleteOffer = useDeleteOffer();
  const imageUrl = resolveAssetUrl(offer.images[0] ?? null);

  return (
    <div className="flex flex-col overflow-hidden rounded-xl border border-border bg-card shadow-xs">
      <div className="relative aspect-4/3 w-full overflow-hidden bg-muted">
        {imageUrl ? (
          <img src={imageUrl} alt={offer.title} className="size-full object-cover" />
        ) : (
          <div className="grid size-full place-items-center text-muted-foreground">
            <ImageOff className="size-6" />
          </div>
        )}
        {offer.tag && <Badge className="absolute top-2.5 start-2.5 shadow-sm">{offer.tag}</Badge>}
        {offer.images.length > 1 && (
          <span className="absolute top-2.5 end-2.5 rounded-full bg-black/60 px-2 py-0.5 text-xs font-medium text-white">
            {t('imagesCount', { count: offer.images.length })}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <p className="truncate font-heading text-sm font-semibold text-foreground">{offer.title}</p>
        {offer.description && <p className="line-clamp-2 text-xs text-muted-foreground">{offer.description}</p>}

        <div className="mt-auto flex items-center justify-between gap-2 pt-2">
          <div className="flex items-center gap-2">
            <Switch
              checked={offer.isActive}
              onCheckedChange={async (next) => {
                try {
                  await setActive.mutateAsync({ id: offer.id, isActive: next });
                  toast.success(t('statusUpdated'));
                } catch (error) {
                  toast.error(error instanceof ApiError ? error.message : t('statusError'));
                }
              }}
              disabled={setActive.isPending}
            />
            <span className="text-xs text-muted-foreground">
              {offer.isActive ? t('activeLabel') : t('inactiveLabel')}
            </span>
          </div>

          <div className="flex items-center gap-1">
            <OfferFormDialog
              offer={offer}
              trigger={
                <Button variant="ghost" size="icon-sm" aria-label={t('edit')}>
                  <Pencil className="size-4 text-muted-foreground" />
                </Button>
              }
              onSubmit={(input) => updateOffer.mutateAsync(input)}
            />
            <ConfirmDialog
              trigger={
                <Button variant="ghost" size="icon-sm" aria-label={t('delete')}>
                  <Trash2 className="size-4 text-muted-foreground" />
                </Button>
              }
              title={t('deleteTitle')}
              description={t('deleteDescription', { title: offer.title })}
              destructive
              confirmLabel={t('delete')}
              onConfirm={async () => {
                try {
                  await deleteOffer.mutateAsync(offer.id);
                  toast.success(t('deleted'));
                } catch (error) {
                  toast.error(error instanceof ApiError ? error.message : t('deleteError'));
                }
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function OffersPage() {
  const t = useTranslations('offers');
  const tCommon = useTranslations('common');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebouncedValue(search, 300);

  const { data, isLoading, isError } = useOffers({ q: debouncedSearch || undefined, page, limit: 20 });
  const { data: branding } = useBranding();
  const setVisibility = useSetOffersVisibility();
  const createOffer = useCreateOffer();

  return (
    <div className="space-y-6">
      <FadeIn>
        <PageHeader
          title={t('title')}
          description={t('subtitle')}
          actions={
            <OfferFormDialog
              trigger={
                <Button>
                  <Plus className="size-4" />
                  {t('newOffer')}
                </Button>
              }
              onSubmit={(input) => createOffer.mutateAsync(input)}
            />
          }
        />
      </FadeIn>

      <FadeIn delay={0.05}>
        <Section bodyClassName="flex items-center justify-between gap-3">
          <span className="text-sm font-medium text-foreground">{t('visibilityLabel')}</span>
          <Switch
            checked={branding?.showOffersOnPublicPage ?? true}
            onCheckedChange={async (next) => {
              try {
                await setVisibility.mutateAsync(next);
                toast.success(t('visibilityUpdated'));
              } catch (error) {
                toast.error(error instanceof ApiError ? error.message : t('visibilityError'));
              }
            }}
            disabled={setVisibility.isPending || !branding}
          />
        </Section>
      </FadeIn>

      <FadeIn delay={0.1} className="space-y-4">
        <SearchInput
          value={search}
          onChange={(value) => {
            setSearch(value);
            setPage(1);
          }}
          placeholder={t('searchPlaceholder')}
          className="w-full"
        />

        {isLoading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <OfferCardSkeleton key={index} />
            ))}
          </div>
        ) : isError || !data ? (
          <Section>
            <EmptyState icon={Sparkles} title={t('loadError')} description={tCommon('tryAgain')} />
          </Section>
        ) : data.data.length === 0 ? (
          <Section>
            <EmptyState
              icon={Sparkles}
              title={debouncedSearch ? t('noResults') : t('noOffersYet')}
              description={debouncedSearch ? undefined : t('createFirst')}
            />
          </Section>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {data.data.map((offer) => (
                <AdminOfferCard key={offer.id} offer={offer} />
              ))}
            </div>
            <PaginationControls page={data.page} totalPages={data.totalPages} onPageChange={setPage} />
          </div>
        )}
      </FadeIn>
    </div>
  );
}
