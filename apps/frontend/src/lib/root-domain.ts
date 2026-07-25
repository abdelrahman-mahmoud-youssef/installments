import { config } from '@/lib/config';
import { RESERVED_SUBDOMAINS } from '@/lib/reserved-subdomains';

export function extractTenantSlug(host: string, rootDomain: string): string | null {
  const hostname = host.split(':')[0];
  if (hostname === rootDomain || hostname === `www.${rootDomain}`) {
    return null;
  }
  if (!hostname.endsWith(`.${rootDomain}`)) {
    return null;
  }
  const subdomain = hostname.slice(0, -(rootDomain.length + 1));
  if (subdomain.includes('.') || RESERVED_SUBDOMAINS.has(subdomain)) {
    return null;
  }
  return subdomain;
}

export function getRootDomain(): string {
  const configured = process.env.NEXT_PUBLIC_ROOT_DOMAIN;
  if (configured) {
    return configured;
  }
  const hostname = new URL(config.siteUrl).hostname;
  return hostname.startsWith('www.') ? hostname.slice(4) : hostname;
}

export function getSubdomainUrl(slug: string, path = ''): string {
  const url = new URL(config.siteUrl);
  const port = url.port ? `:${url.port}` : '';
  return `${url.protocol}//${slug}.${getRootDomain()}${port}${path}`;
}

export function getShopUrl(slug: string): string {
  return getSubdomainUrl(slug);
}
