import { getPublicShop } from '@/lib/api/public';
import { resolveAssetUrl } from '@/lib/assets';
import { renderIconResponse } from '@/lib/render-icon';

export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

export default async function AppleIcon({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const shop = await getPublicShop(slug);
  const logoUrl = shop ? resolveAssetUrl(shop.logoUrl) : null;

  return renderIconResponse(logoUrl, size, 0);
}
