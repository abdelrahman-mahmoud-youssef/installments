import { getPublicCustomer } from '@/lib/api/public';
import { resolveAssetUrl } from '@/lib/assets';
import { renderIconResponse } from '@/lib/render-icon';

export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

export default async function AppleIcon({ params }: { params: Promise<{ uuid: string }> }) {
  const { uuid } = await params;
  const customer = await getPublicCustomer(uuid);
  const logoUrl = customer ? resolveAssetUrl(customer.branding.logoUrl) : null;

  return renderIconResponse(logoUrl, size, 0);
}
