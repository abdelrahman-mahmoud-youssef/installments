import { rootDomain, siteUrl } from './config';

const SHARE_PATH_PREFIX = '/p/';

export function customerPortalPath(customerPublicId: string, contractPublicId?: string): string {
  const customerPath = `/customer/${customerPublicId}`;
  return contractPublicId ? `${customerPath}/contracts/${contractPublicId}` : customerPath;
}

export function buildShopUrl(tenantSlug: string): string {
  if (!rootDomain) {
    return siteUrl;
  }
  const { protocol } = new URL(siteUrl);
  return `${protocol}//${tenantSlug}.${rootDomain}`;
}

export function buildShareUrl(code: string, tenantSlug: string | undefined): string {
  const path = `${SHARE_PATH_PREFIX}${code}`;
  if (!rootDomain || !tenantSlug) {
    return `${siteUrl}${path}`;
  }
  const { protocol } = new URL(siteUrl);
  return `${protocol}//${tenantSlug}.${rootDomain}${path}`;
}
