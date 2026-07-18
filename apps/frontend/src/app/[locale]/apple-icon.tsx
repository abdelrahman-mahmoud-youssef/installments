import { ImageResponse } from 'next/og';

export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(140deg, #0f7a5f, #15b981)',
        }}
      >
        <svg width="112" height="112" viewBox="0 0 24 24" fill="none">
          <rect x="3" y="4" width="18" height="17" rx="2.5" stroke="white" strokeWidth="1.6" />
          <line x1="3" y1="9.5" x2="21" y2="9.5" stroke="white" strokeWidth="1.6" />
          <path
            d="M7.5 14.8l2.6 2.6L16.5 12"
            stroke="white"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    ),
    { ...size },
  );
}
