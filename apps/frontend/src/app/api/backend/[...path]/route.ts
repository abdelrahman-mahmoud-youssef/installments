import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { config } from '@/lib/config';

type RouteContext = { params: Promise<{ path: string[] }> };

async function proxyToBackend(request: NextRequest, path: string[]): Promise<NextResponse> {
  const cookieStore = await cookies();
  const token = cookieStore.get(config.authCookieName)?.value;

  if (!token) {
    return NextResponse.json(
      { statusCode: 401, message: 'Unauthorized', error: 'Unauthorized' },
      { status: 401 },
    );
  }

  const targetUrl = `${config.backendUrl}/${path.join('/')}${request.nextUrl.search}`;
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

export async function GET(request: NextRequest, context: RouteContext): Promise<NextResponse> {
  return proxyToBackend(request, (await context.params).path);
}

export async function POST(request: NextRequest, context: RouteContext): Promise<NextResponse> {
  return proxyToBackend(request, (await context.params).path);
}

export async function PATCH(request: NextRequest, context: RouteContext): Promise<NextResponse> {
  return proxyToBackend(request, (await context.params).path);
}

export async function DELETE(request: NextRequest, context: RouteContext): Promise<NextResponse> {
  return proxyToBackend(request, (await context.params).path);
}
