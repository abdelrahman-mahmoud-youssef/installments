export interface TenantBrandingSource {
  publicId: string;
  name: string;
  displayName: string | null;
  brandColor: string;
  logoUrl: string | null;
  showPublicPricing: boolean;
  phone: string | null;
  about: string | null;
  instagramUrl: string | null;
  facebookUrl: string | null;
  tiktokUrl: string | null;
  showInstallmentCalculator: boolean;
  calculatorMarkupPercent: number | null;
  calculatorInstallmentMonths: number[];
}

export interface TenantBranding {
  publicId: string;
  displayName: string;
  brandColor: string;
  logoUrl: string | null;
  showPublicPricing: boolean;
  phone: string | null;
  about: string | null;
  instagramUrl: string | null;
  facebookUrl: string | null;
  tiktokUrl: string | null;
  showInstallmentCalculator: boolean;
  calculatorMarkupPercent: number | null;
  calculatorInstallmentMonths: number[];
}

export const TENANT_BRANDING_SELECT = {
  publicId: true,
  name: true,
  displayName: true,
  brandColor: true,
  logoUrl: true,
  showPublicPricing: true,
  phone: true,
  about: true,
  instagramUrl: true,
  facebookUrl: true,
  tiktokUrl: true,
  showInstallmentCalculator: true,
  calculatorMarkupPercent: true,
  calculatorInstallmentMonths: true,
} as const;

export function toTenantBranding(tenant: TenantBrandingSource): TenantBranding {
  return {
    publicId: tenant.publicId,
    displayName: tenant.displayName ?? tenant.name,
    brandColor: tenant.brandColor,
    logoUrl: tenant.logoUrl,
    showPublicPricing: tenant.showPublicPricing,
    phone: tenant.phone,
    about: tenant.about,
    instagramUrl: tenant.instagramUrl,
    facebookUrl: tenant.facebookUrl,
    tiktokUrl: tenant.tiktokUrl,
    showInstallmentCalculator: tenant.showInstallmentCalculator,
    calculatorMarkupPercent: tenant.calculatorMarkupPercent,
    calculatorInstallmentMonths: tenant.calculatorInstallmentMonths,
  };
}
