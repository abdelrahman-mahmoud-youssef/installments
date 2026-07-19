import { ImageResponse } from 'next/og';
import { IconMark } from '@/components/shared/icon-mark';
import { getPublicCustomer } from '@/lib/api/public';
import { resolveAssetUrl } from '@/lib/assets';

export const size = { width: 32, height: 32 };
export const contentType = 'image/png';

export default async function Icon({ params }: { params: Promise<{ uuid: string }> }) {
  const { uuid } = await params;
  const customer = await getPublicCustomer(uuid);
  const logoUrl = customer ? resolveAssetUrl(customer.branding.logoUrl) : null;

  if (logoUrl) {
    return new ImageResponse(
      (
        <div style={{ width: '100%', height: '100%', display: 'flex', borderRadius: 7, overflow: 'hidden' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={logoUrl} width={size.width} height={size.height} style={{ objectFit: 'cover' }} alt="" />
        </div>
      ),
      { ...size },
    );
  }

  return new ImageResponse(<IconMark size={21} strokeWidth={2.2} radius={7} />, { ...size });
}
