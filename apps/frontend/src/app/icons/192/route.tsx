import { ImageResponse } from 'next/og';
import { IconMark } from '@/components/shared/icon-mark';

export async function GET() {
  return new ImageResponse(<IconMark size={120} strokeWidth={1.8} radius={42} />, {
    width: 192,
    height: 192,
  });
}
