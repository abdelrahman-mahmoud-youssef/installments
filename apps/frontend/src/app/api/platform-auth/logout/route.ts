import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { config } from '@/lib/config';

export async function POST(): Promise<NextResponse> {
  const cookieStore = await cookies();
  cookieStore.delete(config.platformAuthCookieName);
  return NextResponse.json({ success: true });
}
