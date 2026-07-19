import { getPublicShop } from '@/lib/api/public';
import { resolveAssetUrl } from '@/lib/assets';
import { renderIconResponse } from '@/lib/render-icon';

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const shop = await getPublicShop(slug);
  const logoUrl = shop ? resolveAssetUrl(shop.logoUrl) : null;

  return renderIconResponse(logoUrl, { width: 512, height: 512 }, 112, { size: 320, strokeWidth: 4.8 });
}
