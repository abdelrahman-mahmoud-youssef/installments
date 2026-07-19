import { ImageResponse } from 'next/og';
import { IconMark } from '@/components/shared/icon-mark';

export async function GET() {
  return new ImageResponse(<IconMark size={280} strokeWidth={4.2} radius={0} />, {
    width: 512,
    height: 512,
  });
}
