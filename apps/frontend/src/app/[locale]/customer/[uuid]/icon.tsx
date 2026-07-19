import { getPublicCustomer } from '@/lib/api/public';
import { resolveAssetUrl } from '@/lib/assets';
import { renderIconResponse } from '@/lib/render-icon';

export const size = { width: 32, height: 32 };
export const contentType = 'image/png';

export default async function Icon({ params }: { params: Promise<{ uuid: string }> }) {
  const { uuid } = await params;
  const customer = await getPublicCustomer(uuid);
  const logoUrl = customer ? resolveAssetUrl(customer.branding.logoUrl) : null;

  return renderIconResponse(logoUrl, size, 7, { size: 21, strokeWidth: 2.2 });
}
