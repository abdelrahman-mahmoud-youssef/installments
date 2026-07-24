import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ImageResponse } from 'next/og';

const QISTAK_LOGO_DATA_URL = `data:image/png;base64,${readFileSync(
  join(process.cwd(), 'public/qistak.png'),
).toString('base64')}`;

function renderImage(src: string, size: { width: number; height: number }, radius: number): Response {
  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', borderRadius: radius, overflow: 'hidden' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} width={size.width} height={size.height} style={{ objectFit: 'cover' }} alt="" />
      </div>
    ),
    size,
  );
}

export function renderIconResponse(
  logoUrl: string | null,
  size: { width: number; height: number },
  radius: number,
): Response {
  return renderImage(logoUrl ?? QISTAK_LOGO_DATA_URL, size, radius);
}
