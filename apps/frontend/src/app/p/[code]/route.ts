import { NextRequest, NextResponse } from 'next/server';
import { config } from '@/lib/config';
import { getSubdomainUrl } from '@/lib/root-domain';

export async function GET(request: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;

  const response = await fetch(`${config.backendUrl}/public/share-links/${code}`, { cache: 'no-store' });
  if (!response.ok) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  const { tenantSlug, targetPath } = (await response.json()) as { tenantSlug: string; targetPath: string };
  return NextResponse.redirect(getSubdomainUrl(tenantSlug, targetPath), 302);
}
