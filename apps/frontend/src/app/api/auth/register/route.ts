import { NextRequest, NextResponse } from 'next/server';
import { config } from '@/lib/config';
import { setAuthCookie } from '@/lib/set-auth-cookie';

export async function POST(request: NextRequest): Promise<NextResponse> {
  const body = await request.text();

  const backendResponse = await fetch(`${config.backendUrl}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
  });

  const data: unknown = await backendResponse.json();

  if (!backendResponse.ok) {
    return NextResponse.json(data, { status: backendResponse.status });
  }

  const { accessToken } = data as { accessToken: string };
  await setAuthCookie(accessToken);

  return NextResponse.json({ success: true });
}
