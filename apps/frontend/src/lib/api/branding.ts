import { BrandColorPreset } from '@/lib/schemas/branding';
import { apiClient } from './client';

export interface TenantBranding {
  displayName: string;
  brandColor: BrandColorPreset;
  logoUrl: string | null;
}

export interface UpdateBrandingInput {
  displayName?: string;
  brandColor?: BrandColorPreset;
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
