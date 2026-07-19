export interface TenantBrandingSource {
  name: string;
  displayName: string | null;
  brandColor: string;
  logoUrl: string | null;
  showPublicPricing: boolean;
}

export interface TenantBranding {
  displayName: string;
  brandColor: string;
  logoUrl: string | null;
  showPublicPricing: boolean;
}

export function toTenantBranding(tenant: TenantBrandingSource): TenantBranding {
  return {
    displayName: tenant.displayName ?? tenant.name,
    brandColor: tenant.brandColor,
    logoUrl: tenant.logoUrl,
    showPublicPricing: tenant.showPublicPricing,
  };
}
