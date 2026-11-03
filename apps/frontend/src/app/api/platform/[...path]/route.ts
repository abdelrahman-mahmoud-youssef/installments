import { NextRequest, NextResponse } from 'next/server';
import { proxyToBackend } from '@/lib/backend-proxy';
import { config } from '@/lib/config';

type RouteContext = { params: Promise<{ path: string[] }> };

const PLATFORM_API_PREFIX = 'platform';

async function proxyPlatformRequest(request: NextRequest, context: RouteContext): Promise<NextResponse> {
  const { path } = await context.params;
  return proxyToBackend(request, [PLATFORM_API_PREFIX, ...path], config.platformAuthCookieName);
}

export const GET = proxyPlatformRequest;
export const POST = proxyPlatformRequest;
