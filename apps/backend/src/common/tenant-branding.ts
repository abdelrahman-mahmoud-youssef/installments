export interface CalculatorPlan {
  months: number;
  markupPercent: number;
}

export interface TenantBrandingSource {
  slug: string;
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
  calculatorPlans: unknown;
}

export interface TenantBranding {
  slug: string;
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
  calculatorPlans: CalculatorPlan[];
}

export const TENANT_BRANDING_SELECT = {
  slug: true,
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
  calculatorPlans: true,
} as const;

export function toTenantBranding(tenant: TenantBrandingSource): TenantBranding {
  return {
    slug: tenant.slug,
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
    calculatorPlans: (tenant.calculatorPlans as CalculatorPlan[] | null) ?? [],
  };
}
