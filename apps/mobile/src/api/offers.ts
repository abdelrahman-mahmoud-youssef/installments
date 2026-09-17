import { apiClient, buildQuery, PaginatedResult } from './client';

export const MAX_OFFER_IMAGES = 6;

export interface Offer {
  id: string;
  title: string;
  description: string | null;
  tag: string | null;
  images: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export type OfferListParams = {
  q?: string;
  page?: number;
  limit?: number;
};

export interface SaveOfferInput {
  title: string;
  description?: string;
  tag?: string;
  isActive: boolean;
  images: string[];
  newImages: string[];
}

export function listOffers(params: OfferListParams): Promise<PaginatedResult<Offer>> {
  return apiClient.get(`offers${buildQuery(params)}`);
}

export function createOffer(input: SaveOfferInput): Promise<Offer> {
  return apiClient.post('offers', input);
}

export function updateOffer(id: string, input: Partial<SaveOfferInput>): Promise<Offer> {
  return apiClient.patch(`offers/${id}`, input);
}

export function deleteOffer(id: string): Promise<void> {
  return apiClient.delete(`offers/${id}`);
}

export function setOffersVisibility(showOffersOnPublicPage: boolean): Promise<{ showOffersOnPublicPage: boolean }> {
  return apiClient.patch('offers/visibility', { showOffersOnPublicPage });
}
