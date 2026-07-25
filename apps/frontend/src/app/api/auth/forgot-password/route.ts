import { NextRequest, NextResponse } from 'next/server';
import { config } from '@/lib/config';

export async function POST(request: NextRequest): Promise<NextResponse> {
  const body = await request.text();

  const backendResponse = await fetch(`${config.backendUrl}/auth/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
  });

  const data: unknown = await backendResponse.json().catch(() => null);

  return NextResponse.json(data, { status: backendResponse.status });
}
