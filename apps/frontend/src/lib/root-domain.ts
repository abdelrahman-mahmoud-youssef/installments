import { config } from '@/lib/config';

export function getRootDomain(): string {
  const hostname = new URL(config.siteUrl).hostname;
  return hostname.startsWith('www.') ? hostname.slice(4) : hostname;
}

export function getSubdomainUrl(slug: string, path = ''): string {
  return `https://${slug}.${getRootDomain()}${path}`;
}

export function getShopUrl(slug: string): string {
  return getSubdomainUrl(slug);
}
