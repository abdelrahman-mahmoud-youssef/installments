import { ImageResponse } from 'next/og';
import { QISTAK_LOGO_BASE64 } from './qistak-logo-data';

const QISTAK_LOGO_DATA_URL = `data:image/png;base64,${QISTAK_LOGO_BASE64}`;

export function renderImage(src: string, size: { width: number; height: number }, radius: number): Response {
  return new ImageResponse(
    (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        width={size.width}
        height={size.height}
        style={{ display: 'flex', width: '100%', height: '100%', objectFit: 'cover', borderRadius: radius }}
        alt=""
      />
    ),
    size,
  );
}

export function renderIconResponse(
  logoUrl: string | null,
  size: { width: number; height: number },
  radius: number,
): Response {
  if (logoUrl) {
    return renderImage(logoUrl, size, radius);
  }
  return renderImage(QISTAK_LOGO_DATA_URL, size, size.width / 2);
}
