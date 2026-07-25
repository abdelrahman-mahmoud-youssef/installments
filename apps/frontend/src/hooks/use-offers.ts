import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { brandingKeys } from '@/hooks/use-branding';
import {
  createOffer,
  deleteOffer,
  listOffers,
  Offer,
  OfferListParams,
  setOfferActive,
  setOffersVisibility,
  updateOffer,
} from '@/lib/api/offers';
import { OfferInput } from '@/lib/schemas/offer';

export const offerKeys = {
  all: ['offers'] as const,
  list: (params: OfferListParams) => [...offerKeys.all, 'list', params] as const,
};

export function useOffers(params: OfferListParams) {
  return useQuery({
    queryKey: offerKeys.list(params),
    queryFn: () => listOffers(params),
    placeholderData: (previousData) => previousData,
  });
}

export function useCreateOffer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: OfferInput) => createOffer(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: offerKeys.all }),
  });
}

export function useUpdateOffer(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: Partial<OfferInput>) => updateOffer(id, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: offerKeys.all }),
  });
}

export function useSetOfferActive() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) => setOfferActive(id, isActive),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: offerKeys.all }),
  });
}

export function useDeleteOffer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteOffer(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: offerKeys.all }),
  });
}

export function useSetOffersVisibility() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (showOffersOnPublicPage: boolean) => setOffersVisibility(showOffersOnPublicPage),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: brandingKeys.all }),
  });
}

export type { Offer };
