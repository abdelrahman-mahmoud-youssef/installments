import { cookies } from 'next/headers';
import { getBrandingServer } from '@/lib/api/branding';
import { resolveAssetUrl } from '@/lib/assets';
import { config } from '@/lib/config';
import { renderIconResponse } from '@/lib/render-icon';

export const size = { width: 32, height: 32 };
export const contentType = 'image/png';

export default async function Icon() {
  const cookieStore = await cookies();
  const token = cookieStore.get(config.authCookieName)?.value;
  const branding = token ? await getBrandingServer(token) : null;
  const logoUrl = branding ? resolveAssetUrl(branding.logoUrl) : null;

  return renderIconResponse(logoUrl, size, 7);
}
