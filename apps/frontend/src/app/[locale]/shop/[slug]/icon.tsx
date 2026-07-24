import { getPublicShop } from '@/lib/api/public';
import { resolveAssetUrl } from '@/lib/assets';
import { renderIconResponse } from '@/lib/render-icon';

export const size = { width: 32, height: 32 };
export const contentType = 'image/png';

export default async function Icon({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const shop = await getPublicShop(slug);
  const logoUrl = shop ? resolveAssetUrl(shop.logoUrl) : null;

  return renderIconResponse(logoUrl, size, 7);
}
