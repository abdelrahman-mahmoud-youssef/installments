import { ImageResponse } from 'next/og';
import { IconMark } from '@/components/shared/icon-mark';

export async function GET() {
  return new ImageResponse(<IconMark size={320} strokeWidth={4.8} radius={112} />, {
    width: 512,
    height: 512,
  });
}
