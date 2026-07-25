import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { ImageResponse } from 'next/og';
import { BRAND_COLOR_VALUES } from '@/lib/brand-colors';
import { QISTAK_LOGO_BASE64 } from '@/lib/qistak-logo-data';
import { BrandColorPreset } from '@/lib/schemas/branding';

const QISTAK_LOGO_DATA_URL = `data:image/png;base64,${QISTAK_LOGO_BASE64}`;

export const OG_IMAGE_SIZE = { width: 1200, height: 630 };

const ARABIC_CHAR_PATTERN = /[؀-ۿ]/;

function visualOrder(text: string): string {
  return ARABIC_CHAR_PATTERN.test(text) ? text.split(' ').reverse().join(' ') : text;
}

let arabicFontsPromise: Promise<{ name: string; data: Buffer; weight: 400 | 700; style: 'normal' }[]> | null = null;

function loadArabicFonts() {
  if (!arabicFontsPromise) {
    arabicFontsPromise = Promise.all([
      readFile(join(process.cwd(), 'assets/fonts/IBMPlexSansArabic-Regular.ttf')),
      readFile(join(process.cwd(), 'assets/fonts/IBMPlexSansArabic-Bold.ttf')),
    ]).then(([regular, bold]) => [
      { name: 'IBM Plex Sans Arabic', data: regular, weight: 400 as const, style: 'normal' as const },
      { name: 'IBM Plex Sans Arabic', data: bold, weight: 700 as const, style: 'normal' as const },
    ]);
  }
  return arabicFontsPromise;
}

export async function renderOgImageResponse({
  logoUrl,
  brandColor,
  title,
  subtitle,
}: {
  logoUrl: string | null;
  brandColor: BrandColorPreset;
  title: string;
  subtitle?: string;
}): Promise<ImageResponse> {
  const color = BRAND_COLOR_VALUES[brandColor];
  const fonts = await loadArabicFonts();

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
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={logoUrl ?? QISTAK_LOGO_DATA_URL}
          width={140}
          height={140}
          style={{
            borderRadius: 28,
            objectFit: 'cover',
            border: '4px solid rgba(255,255,255,0.5)',
          }}
          alt=""
        />
        <div
          style={{
            display: 'flex',
            fontSize: 56,
            fontWeight: 700,
            fontFamily: 'IBM Plex Sans Arabic',
            color: 'white',
            textAlign: 'center',
          }}
        >
          {visualOrder(title)}
        </div>
        {subtitle && (
          <div
            style={{
              display: 'flex',
              fontSize: 30,
              fontFamily: 'IBM Plex Sans Arabic',
              color: 'rgba(255,255,255,0.85)',
              textAlign: 'center',
            }}
          >
            {visualOrder(subtitle)}
          </div>
        )}
      </div>
    ),
    { ...OG_IMAGE_SIZE, fonts },
  );
}
