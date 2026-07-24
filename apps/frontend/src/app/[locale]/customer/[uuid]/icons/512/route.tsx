import { getPublicCustomer } from '@/lib/api/public';
import { resolveAssetUrl } from '@/lib/assets';
import { renderIconResponse } from '@/lib/render-icon';

export async function GET(_request: Request, { params }: { params: Promise<{ uuid: string }> }) {
  const { uuid } = await params;
  const customer = await getPublicCustomer(uuid);
  const logoUrl = customer ? resolveAssetUrl(customer.branding.logoUrl) : null;

  return renderIconResponse(logoUrl, { width: 512, height: 512 }, 112);
}
