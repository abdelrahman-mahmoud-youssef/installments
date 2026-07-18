import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { config } from '@/lib/config';

const SEVEN_DAYS_IN_SECONDS = 60 * 60 * 24 * 7;

export async function POST(request: NextRequest): Promise<NextResponse> {
  const body = await request.text();

  const backendResponse = await fetch(`${config.backendUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
  });

  const data: unknown = await backendResponse.json();

  if (!backendResponse.ok) {
    return NextResponse.json(data, { status: backendResponse.status });
  }

  const { accessToken } = data as { accessToken: string };
  const cookieStore = await cookies();
  cookieStore.set(config.authCookieName, accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SEVEN_DAYS_IN_SECONDS,
  });

  return NextResponse.json({ success: true });
}
