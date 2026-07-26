import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { getPublicShop } from '@/lib/api/public';
import { config } from '@/lib/config';
import { getSubdomainUrl } from '@/lib/root-domain';

interface ResolvedShareLink {
  tenantSlug: string;
  targetPath: string;
}

async function resolveShareLink(code: string): Promise<ResolvedShareLink | null> {
  const response = await fetch(`${config.backendUrl}/public/share-links/${code}`, { cache: 'no-store' });
  if (!response.ok) {
    return null;
  }
  return response.json() as Promise<ResolvedShareLink>;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ code: string }>;
}): Promise<Metadata> {
  const { code } = await params;
  const resolved = await resolveShareLink(code);
  if (!resolved) {
    return { title: 'Link not found' };
  }
  const shop = await getPublicShop(resolved.tenantSlug);
  return { title: shop ? `Redirecting to ${shop.displayName}…` : 'Redirecting…' };
}

export default async function ShortLinkPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;

  const resolved = await resolveShareLink(code);
  if (!resolved) {
    notFound();
  }

  redirect(getSubdomainUrl(resolved.tenantSlug, resolved.targetPath));
}
