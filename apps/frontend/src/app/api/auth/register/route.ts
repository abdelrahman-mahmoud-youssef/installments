import { NextRequest, NextResponse } from 'next/server';
import { config } from '@/lib/config';
import { setAuthCookie } from '@/lib/set-auth-cookie';

export async function POST(request: NextRequest): Promise<NextResponse> {
  const payload = (await request.json()) as Record<string, unknown>;
  const referralCode = request.cookies.get(config.referralCookieName)?.value;

  const backendResponse = await fetch(`${config.backendUrl}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(referralCode ? { ...payload, referralCode } : payload),
  });

  const data: unknown = await backendResponse.json();

  if (!backendResponse.ok) {
    return NextResponse.json(data, { status: backendResponse.status });
  }

  const { accessToken } = data as { accessToken: string };
  await setAuthCookie(accessToken);

  const response = NextResponse.json({ success: true });
  response.cookies.delete(config.referralCookieName);
  return response;
}
