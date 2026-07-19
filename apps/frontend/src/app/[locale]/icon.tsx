import { ImageResponse } from 'next/og';
import { IconMark } from '@/components/shared/icon-mark';

export const size = { width: 32, height: 32 };
export const contentType = 'image/png';

export default function Icon() {
  return new ImageResponse(<IconMark size={21} strokeWidth={2.2} radius={7} />, { ...size });
}
