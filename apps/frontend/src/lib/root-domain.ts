import { config } from '@/lib/config';


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
