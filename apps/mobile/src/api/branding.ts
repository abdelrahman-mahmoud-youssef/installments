import { BrandColorPreset } from '@/lib/brand-colors';
import { apiClient } from './client';

export interface CalculatorPlan {
  months: number;
  markupPercent: number;
}

export interface TenantLocation {
  id: string;
  name: string;
  address: string;
  mapUrl?: string;
}

export interface TenantBranding {
  slug: string;
  displayName: string;
  brandColor: BrandColorPreset;
  logoUrl: string | null;
  showPublicPricing: boolean;
  phone: string | null;
  about: string | null;
  instagramUrl: string | null;
  facebookUrl: string | null;
  tiktokUrl: string | null;
  showInstallmentCalculator: boolean;
  calculatorPlans: CalculatorPlan[];
  locations: TenantLocation[];
  showOffersOnPublicPage: boolean;
}

export interface UpdateBrandingInput {
  displayName?: string;
  slug?: string;
  brandColor?: BrandColorPreset;
  showPublicPricing?: boolean;
  phone?: string;
  instagramUrl?: string;
  facebookUrl?: string;
  tiktokUrl?: string;
  showInstallmentCalculator?: boolean;
  calculatorPlans?: CalculatorPlan[];
  locations?: TenantLocation[];
}

export function getBranding(): Promise<TenantBranding> {
  return apiClient.get('settings/branding');
}

export function updateBranding(input: UpdateBrandingInput): Promise<TenantBranding> {
  return apiClient.patch('settings/branding', input);
}

export function uploadLogo(image: string): Promise<TenantBranding> {
  return apiClient.post('settings/branding/logo', { image });
}

export function removeLogo(): Promise<TenantBranding> {
  return apiClient.delete('settings/branding/logo');
}
