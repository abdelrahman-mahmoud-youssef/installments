import { ImageResponse } from 'next/og';
import { IconMark } from '@/components/shared/icon-mark';

export function renderIconResponse(
  logoUrl: string | null,
  size: { width: number; height: number },
  radius: number,
  fallback: { size: number; strokeWidth: number },
): Response {
  if (logoUrl) {
    return new ImageResponse(
      (
        <div style={{ width: '100%', height: '100%', display: 'flex', borderRadius: radius, overflow: 'hidden' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={logoUrl} width={size.width} height={size.height} style={{ objectFit: 'cover' }} alt="" />
        </div>
      ),
      size,
    );
  }
  return new ImageResponse(<IconMark {...fallback} radius={radius} />, size);
}
