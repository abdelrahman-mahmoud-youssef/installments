import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { config } from '@/lib/config';

export async function proxyToBackend(
  request: NextRequest,
  pathSegments: string[],
  tokenCookieName: string,
): Promise<NextResponse> {
  const cookieStore = await cookies();
  const token = cookieStore.get(tokenCookieName)?.value;

  if (!token) {
    return NextResponse.json(
      { statusCode: 401, message: 'Unauthorized', error: 'Unauthorized' },
      { status: 401 },
    );
  }

  const targetUrl = `${config.backendUrl}/${pathSegments.join('/')}${request.nextUrl.search}`;
  const hasBody = request.method !== 'GET' && request.method !== 'DELETE';

  const backendResponse = await fetch(targetUrl, {
    method: request.method,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(hasBody ? { 'Content-Type': 'application/json' } : {}),
    },
    body: hasBody ? await request.text() : undefined,
  });

  const responseBody = await backendResponse.text();
  const hasResponseBody = responseBody.length > 0 && backendResponse.status !== 204;
  return new NextResponse(hasResponseBody ? responseBody : null, {
    status: backendResponse.status,
    headers: { 'Content-Type': backendResponse.headers.get('Content-Type') ?? 'application/json' },
  });
}
