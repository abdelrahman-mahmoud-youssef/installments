import { NextRequest, NextResponse } from 'next/server';
import { proxyToBackend } from '@/lib/backend-proxy';
import { config } from '@/lib/config';

type RouteContext = { params: Promise<{ path: string[] }> };

async function proxyTenantRequest(request: NextRequest, context: RouteContext): Promise<NextResponse> {
  return proxyToBackend(request, (await context.params).path, config.authCookieName);
}

export const GET = proxyTenantRequest;
export const POST = proxyTenantRequest;
export const PATCH = proxyTenantRequest;
export const DELETE = proxyTenantRequest;
