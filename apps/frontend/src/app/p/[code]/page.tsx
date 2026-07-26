import { notFound, redirect } from 'next/navigation';
import { config } from '@/lib/config';
import { getSubdomainUrl } from '@/lib/root-domain';

export default async function ShortLinkPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;

  const response = await fetch(`${config.backendUrl}/public/share-links/${code}`, { cache: 'no-store' });
  if (!response.ok) {
    notFound();
  }

  const { tenantSlug, targetPath } = (await response.json()) as { tenantSlug: string; targetPath: string };
  redirect(getSubdomainUrl(tenantSlug, targetPath));
}
