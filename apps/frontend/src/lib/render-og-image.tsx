import { ImageResponse } from 'next/og';
import { BRAND_COLOR_VALUES } from '@/lib/brand-colors';
import { BrandColorPreset } from '@/lib/schemas/branding';

export const OG_IMAGE_SIZE = { width: 1200, height: 630 };

export function renderOgImageResponse({
  logoUrl,
  brandColor,
  title,
  subtitle,
}: {
  logoUrl: string | null;
  brandColor: BrandColorPreset;
  title: string;
  subtitle?: string;
}): ImageResponse {
  const color = BRAND_COLOR_VALUES[brandColor];

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 28,
          background: color,
          padding: 80,
        }}
      >
        {logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={logoUrl}
            width={140}
            height={140}
            style={{
              borderRadius: 28,
              objectFit: 'cover',
              border: '4px solid rgba(255,255,255,0.5)',
            }}
            alt=""
          />
        ) : (
          <div
            style={{
              width: 140,
              height: 140,
              borderRadius: 28,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(255,255,255,0.15)',
              border: '4px solid rgba(255,255,255,0.5)',
            }}
          >
            <svg width={80} height={80} viewBox="0 0 24 24" fill="none">
              <rect x="3" y="4" width="18" height="17" rx="2.5" stroke="white" strokeWidth={1.8} />
              <line x1="3" y1="9.5" x2="21" y2="9.5" stroke="white" strokeWidth={1.8} />
              <path
                d="M7.5 14.8l2.6 2.6L16.5 12"
                stroke="white"
                strokeWidth={1.8}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        )}
        <div
          style={{
            display: 'flex',
            fontSize: 56,
            fontWeight: 700,
            color: 'white',
            textAlign: 'center',
          }}
        >
          {title}
        </div>
        {subtitle && (
          <div
            style={{
              display: 'flex',
              fontSize: 30,
              color: 'rgba(255,255,255,0.85)',
              textAlign: 'center',
            }}
          >
            {subtitle}
          </div>
        )}
      </div>
    ),
    OG_IMAGE_SIZE,
  );
}
