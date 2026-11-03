import { NextRequest, NextResponse } from 'next/server';
import { config } from '@/lib/config';
import { setPlatformAuthCookie } from '@/lib/set-auth-cookie';

export async function POST(request: NextRequest): Promise<NextResponse> {
  const backendResponse = await fetch(`${config.backendUrl}/platform/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: await request.text(),
  });

  const data: unknown = await backendResponse.json();
  if (!backendResponse.ok) {
    return NextResponse.json(data, { status: backendResponse.status });
  }

  const { accessToken } = data as { accessToken: string };
  await setPlatformAuthCookie(accessToken);
  return NextResponse.json({ success: true });
}
