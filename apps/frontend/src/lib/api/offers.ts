import { fileToBase64 } from '@/lib/file';
import { OfferInput } from '@/lib/schemas/offer';
import { apiClient } from './client';
import { buildQuery, PaginatedResult } from './pagination';

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

export interface OfferListParams {
  q?: string;
  page?: number;
  limit?: number;
}

export function listOffers(params: OfferListParams): Promise<PaginatedResult<Offer>> {
  return apiClient.get(`offers${buildQuery(params)}`);
}

async function toOfferPayload(input: Partial<OfferInput>): Promise<Record<string, unknown>> {
  const { images, ...rest } = input;
  const existingImages = (images ?? []).filter((image): image is string => typeof image === 'string');
  const newFiles = (images ?? []).filter((image): image is File => image instanceof File);
  const newImages = await Promise.all(newFiles.map(fileToBase64));
  return { ...rest, images: existingImages, newImages };
}

export async function createOffer(input: OfferInput): Promise<Offer> {
  return apiClient.post('offers', await toOfferPayload(input));
}

export async function updateOffer(id: string, input: Partial<OfferInput>): Promise<Offer> {
  return apiClient.patch(`offers/${id}`, await toOfferPayload(input));
}

export function setOfferActive(id: string, isActive: boolean): Promise<Offer> {
  return apiClient.patch(`offers/${id}`, { isActive });
}

export function deleteOffer(id: string): Promise<void> {
  return apiClient.delete(`offers/${id}`);
}

export function setOffersVisibility(showOffersOnPublicPage: boolean): Promise<{ showOffersOnPublicPage: boolean }> {
  return apiClient.patch('offers/visibility', { showOffersOnPublicPage });
}
