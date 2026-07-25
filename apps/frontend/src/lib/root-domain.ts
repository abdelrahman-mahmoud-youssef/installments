import { config } from '@/lib/config';

export function getRootDomain(): string {
  const hostname = new URL(config.siteUrl).hostname;
  return hostname.startsWith('www.') ? hostname.slice(4) : hostname;
}
