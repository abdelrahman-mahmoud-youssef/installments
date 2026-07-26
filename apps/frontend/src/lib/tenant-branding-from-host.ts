import { headers } from 'next/headers';
import { TenantBranding } from '@/lib/api/branding';
import { getPublicShop } from '@/lib/api/public';
import { extractTenantSlug, getRootDomain } from '@/lib/root-domain';

export async function getTenantBrandingFromHost(): Promise<TenantBranding | null> {
  const host = (await headers()).get('host') ?? '';
  const slug = extractTenantSlug(host, getRootDomain());
  if (!slug) {
    return null;
  }
  return getPublicShop(slug);
}
