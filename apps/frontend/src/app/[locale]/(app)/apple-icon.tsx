import { cookies } from 'next/headers';
import { getBrandingServer } from '@/lib/api/branding';
import { resolveAssetUrl } from '@/lib/assets';
import { config } from '@/lib/config';
import { renderIconResponse } from '@/lib/render-icon';

export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

export default async function AppleIcon() {
  const cookieStore = await cookies();
  const token = cookieStore.get(config.authCookieName)?.value;
  const branding = token ? await getBrandingServer(token) : null;
  const logoUrl = branding ? resolveAssetUrl(branding.logoUrl) : null;

  return renderIconResponse(logoUrl, size, 0, { size: 112, strokeWidth: 1.6 });
}
